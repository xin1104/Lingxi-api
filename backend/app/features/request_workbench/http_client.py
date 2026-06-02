"""HTTP 客户端 - 使用 httpx 发送真实请求"""

import httpx
import time
from typing import Optional
from app.schemas import ApiResponseData


async def send_request(
    method: str,
    url: str,
    params: Optional[dict] = None,
    headers: Optional[dict] = None,
    body: Optional[dict] = None,
    body_type: str = "none",
    timeout: int = 30,
    proxy: Optional[str] = None,
) -> ApiResponseData:
    """发送 HTTP 请求

    Args:
        method: 请求方法
        url: 请求 URL
        params: 查询参数
        headers: 请求头
        body: 请求体数据
        body_type: 请求体类型
        timeout: 超时时间（秒）
        proxy: 代理地址

    Returns:
        ApiResponseData: 响应数据
    """
    start_time = time.time()

    try:
        # 构建请求参数
        request_kwargs = {
            "method": method.upper(),
            "url": url,
            "params": params or {},
            "headers": headers or {},
            "timeout": timeout,
            "follow_redirects": True,
        }

        # 设置代理
        if proxy:
            request_kwargs["proxy"] = proxy

        # 设置请求体
        if body and body_type != "none":
            if body_type == "json":
                request_kwargs["json"] = body.get("json_data")
            elif body_type == "raw":
                request_kwargs["content"] = body.get("raw", "").encode("utf-8")
            elif body_type == "form_data":
                form_data = body.get("form_data", [])
                request_kwargs["data"] = {item["key"]: item["value"] for item in form_data if item.get("enabled", True)}
            elif body_type == "urlencoded":
                urlencoded = body.get("urlencoded", [])
                request_kwargs["data"] = {item["key"]: item["value"] for item in urlencoded if item.get("enabled", True)}

        # 发送请求
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.request(**request_kwargs)

            # 计算耗时
            duration = int((time.time() - start_time) * 1000)

            # 获取响应体
            body_text = response.text
            body_size = len(response.content)

            # 获取 Content-Type
            content_type = response.headers.get("content-type", "")

            return ApiResponseData(
                status_code=response.status_code,
                headers=dict(response.headers),
                body=body_text,
                body_size=body_size,
                duration=duration,
                content_type=content_type,
            )

    except httpx.TimeoutException:
        duration = int((time.time() - start_time) * 1000)
        return ApiResponseData(
            status_code=0,
            duration=duration,
            error="连接超时，请检查服务地址或代理设置",
        )
    except httpx.ConnectError as e:
        duration = int((time.time() - start_time) * 1000)
        error_str = str(e)
        if "Name or service not known" in error_str or "getaddrinfo failed" in error_str:
            return ApiResponseData(
                status_code=0,
                duration=duration,
                error="DNS 解析失败，请检查域名",
            )
        return ApiResponseData(
            status_code=0,
            duration=duration,
            error="连接被拒绝，请确认目标服务是否启动",
        )
    except Exception as e:
        duration = int((time.time() - start_time) * 1000)
        error_msg = str(e)
        if "Connection reset" in error_msg:
            error_msg = "远程主机重置连接"
        elif "Connection refused" in error_msg:
            error_msg = "连接被拒绝，请确认目标服务是否启动"
        return ApiResponseData(
            status_code=0,
            duration=duration,
            error=f"请求失败: {error_msg}",
        )
