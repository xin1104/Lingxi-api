"""HTTP 代理服务 — 基础 HTTP 代理抓包"""

import asyncio
import time
from urllib.parse import urlparse

import httpx
from sqlmodel import Session

from app.database import engine
from app.models import ProxyLog


class HTTPProxyServer:
    """基础 HTTP 代理服务器。

    只代理 HTTP 请求，HTTPS CONNECT 仅记录域名和端口，不解密内容。
    默认只监听 127.0.0.1，仅供本机调试使用。
    """

    def __init__(self, host: str = "127.0.0.1", port: int = 8899):
        self.host = host
        self.port = port
        self._server: asyncio.AbstractServer | None = None
        self._running = False
        self._tasks: set[asyncio.Task] = set()

    @property
    def running(self) -> bool:
        return self._running

    @property
    def address(self) -> str:
        return f"http://{self.host}:{self.port}"

    async def start(self):
        """启动代理服务器"""
        if self._running:
            raise RuntimeError("代理服务器已在运行")
        try:
            self._server = await asyncio.start_server(
                self._handle_client,
                self.host,
                self.port,
            )
            self._running = True
        except OSError as e:
            if "Address already in use" in str(e) or "address already in use" in str(e).lower():
                raise RuntimeError(f"端口 {self.port} 已被占用，请更换端口后重试")
            raise RuntimeError(f"启动代理失败: {e}")

    async def stop(self):
        """停止代理服务器"""
        if not self._running or not self._server:
            return
        self._running = False
        self._server.close()
        await self._server.wait_closed()
        self._server = None

    async def _handle_client(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ):
        """处理客户端连接"""
        task = asyncio.current_task()
        if task:
            self._tasks.add(task)
        try:
            await self._proxy_request(reader, writer)
        except Exception:
            pass
        finally:
            if task:
                self._tasks.discard(task)
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass

    async def _proxy_request(
        self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter
    ):
        """代理 HTTP 请求"""
        start_time = time.time()

        # 读取请求行
        request_line = await reader.readline()
        if not request_line:
            return

        request_line_str = request_line.decode("utf-8", errors="replace").strip()
        parts = request_line_str.split(" ")
        if len(parts) < 2:
            return

        method = parts[0].upper()
        target = parts[1]

        # 读取请求头
        headers: dict[str, str] = {}
        content_length = 0
        while True:
            line = await reader.readline()
            if not line or line == b"\r\n" or line == b"\n":
                break
            line_str = line.decode("utf-8", errors="replace").strip()
            if ":" in line_str:
                key, value = line_str.split(":", 1)
                key_lower = key.strip().lower()
                value = value.strip()
                headers[key_lower] = value
                if key_lower == "content-length":
                    try:
                        content_length = int(value)
                    except ValueError:
                        pass

        # 读取请求体
        body_bytes = b""
        if content_length > 0:
            try:
                body_bytes = await reader.readexactly(content_length)
            except asyncio.IncompleteReadError as e:
                body_bytes = e.partial
        else:
            # 尝试读取更多数据（没有 Content-Length 的情况）
            try:
                extra = await asyncio.wait_for(reader.read(65536), timeout=0.5)
                body_bytes = extra
            except (asyncio.TimeoutError, Exception):
                pass

        duration = int((time.time() - start_time) * 1000)

        # === HTTPS CONNECT: 只记录，不解密 ===
        if method == "CONNECT":
            host = target.split(":")[0] if ":" in target else target
            port_str = target.split(":")[1] if ":" in target else "443"
            _save_proxy_log(
                source="proxy",
                method="CONNECT",
                url=target,
                host=host,
                path="",
                status_code=None,
                duration=duration,
                request_headers=headers,
                is_https_connect=True,
                note=f"HTTPS CONNECT — 目标 {host}:{port_str}，当前版本不解密内容",
            )
            # 返回 200 Connection Established（但不建立隧道）
            try:
                writer.write(b"HTTP/1.1 200 Connection Established\r\n\r\n")
                await writer.drain()
            except Exception:
                pass
            return

        # === HTTP 请求代理 ===
        parsed_url = urlparse(target)
        if parsed_url.hostname:
            proxy_url = target
            proxy_host = parsed_url.hostname
            proxy_path = parsed_url.path or "/"
        else:
            # 相对路径 — 使用 Host header
            host_header = headers.get("host", "")
            if host_header:
                proxy_host = host_header.split(":")[0]
                scheme = "https" if headers.get("x-forwarded-proto") == "https" else "http"
                proxy_url = f"{scheme}://{host_header}{target}"
                proxy_path = target
            else:
                proxy_host = ""
                proxy_url = target
                proxy_path = target

        # 构建转发请求头（移除 hop-by-hop 头）
        fwd_headers = {}
        hop_by_hop = {
            "connection", "proxy-connection", "keep-alive",
            "proxy-authenticate", "proxy-authorization", "te", "trailers",
            "transfer-encoding", "upgrade",
        }
        for key, value in headers.items():
            if key not in hop_by_hop:
                fwd_headers[key] = value

        body_preview = body_bytes[:4096].decode("utf-8", errors="replace") if body_bytes else ""

        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                resp = await client.request(
                    method=method,
                    url=proxy_url,
                    headers=fwd_headers,
                    content=body_bytes if body_bytes else None,
                    follow_redirects=True,
                )

            resp_duration = int((time.time() - start_time) * 1000)
            resp_body = resp.content
            resp_body_preview = resp_body[:4096].decode("utf-8", errors="replace") if resp_body else ""
            resp_headers = dict(resp.headers)

            _save_proxy_log(
                source="proxy",
                method=method,
                url=proxy_url,
                host=proxy_host,
                path=proxy_path,
                status_code=resp.status_code,
                duration=resp_duration,
                request_headers=headers,
                request_body_preview=body_preview,
                response_headers=resp_headers,
                response_body_preview=resp_body_preview,
                content_type=resp.headers.get("content-type", ""),
                size=len(resp_body),
            )

            # 返回响应
            status_line = f"HTTP/1.1 {resp.status_code} {resp.reason_phrase or 'OK'}\r\n"
            writer.write(status_line.encode())
            for key, value in resp_headers.items():
                if key.lower() not in hop_by_hop:
                    writer.write(f"{key}: {value}\r\n".encode())
            writer.write(b"\r\n")
            writer.write(resp_body)
            await writer.drain()

        except httpx.TimeoutException:
            duration = int((time.time() - start_time) * 1000)
            _save_proxy_log(
                source="proxy",
                method=method,
                url=proxy_url,
                host=proxy_host,
                path=proxy_path,
                duration=duration,
                request_headers=headers,
                request_body_preview=body_preview,
                error_message="连接超时，请检查目标地址或代理设置",
            )
            _send_error(writer, 504, "Gateway Timeout — 连接超时")
        except httpx.ConnectError as e:
            duration = int((time.time() - start_time) * 1000)
            error_str = str(e)
            if "Name or service not known" in error_str:
                msg = "DNS 解析失败，请检查域名"
            else:
                msg = "连接被拒绝，请确认目标服务是否启动"
            _save_proxy_log(
                source="proxy",
                method=method,
                url=proxy_url,
                host=proxy_host,
                path=proxy_path,
                duration=duration,
                request_headers=headers,
                request_body_preview=body_preview,
                error_message=msg,
            )
            _send_error(writer, 502, f"Bad Gateway — {msg}")
        except Exception as e:
            duration = int((time.time() - start_time) * 1000)
            _save_proxy_log(
                source="proxy",
                method=method,
                url=proxy_url,
                host=proxy_host,
                path=proxy_path,
                duration=duration,
                request_headers=headers,
                request_body_preview=body_preview,
                error_message=f"请求失败: {e}",
            )
            _send_error(writer, 502, f"Bad Gateway — 请求失败: {e}")


def _send_error(writer: asyncio.StreamWriter, code: int, message: str):
    """发送错误响应"""
    try:
        body = f"<html><body><h1>{code} {message}</h1></body></html>"
        writer.write(f"HTTP/1.1 {code} {message}\r\n".encode())
        writer.write(f"Content-Length: {len(body.encode())}\r\n".encode())
        writer.write(b"Content-Type: text/html; charset=utf-8\r\n")
        writer.write(b"Connection: close\r\n\r\n")
        writer.write(body.encode())
        # Don't drain/close here — caller handles it
    except Exception:
        pass


def _save_proxy_log(**kwargs):
    """保存代理日志到 SQLite（新会话，避免异步冲突）"""
    try:
        with Session(engine) as session:
            log = ProxyLog(**kwargs)
            session.add(log)
            session.commit()
    except Exception:
        pass  # 日志保存失败不影响代理功能


# 全局代理实例
_proxy_instance: HTTPProxyServer | None = None


def get_proxy() -> HTTPProxyServer | None:
    return _proxy_instance


def set_proxy(proxy: HTTPProxyServer | None):
    global _proxy_instance
    _proxy_instance = proxy
