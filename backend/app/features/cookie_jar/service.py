"""Cookie Jar 服务 — 解析 Set-Cookie 并管理 Cookie 存储"""

from datetime import datetime
from http.cookies import SimpleCookie
from typing import Optional
from urllib.parse import urlparse

from sqlmodel import Session, select
from app.models import CookieJar


def _parse_set_cookie(set_cookie_str: str, request_url: str) -> Optional[dict]:
    """解析单个 Set-Cookie 头，返回 cookie 属性字典。

    Args:
        set_cookie_str: Set-Cookie 原始值
        request_url: 发起请求的 URL（用于推导默认 domain/path）

    Returns:
        dict | None: cookie 属性，解析失败返回 None
    """
    cookie = SimpleCookie()
    try:
        cookie.load(set_cookie_str)
    except Exception:
        return None

    parsed_url = urlparse(request_url)
    default_domain = parsed_url.hostname or ""
    default_path = parsed_url.path.rsplit("/", 1)[0] or "/"

    for key in cookie:
        morsel = cookie[key]
        result = {
            "name": key,
            "value": morsel.value,
            "domain": morsel.get("domain", "") or default_domain,
            "path": morsel.get("path", "") or default_path,
            "secure": bool(morsel.get("secure", False)),
            "http_only": bool(morsel.get("httponly", False)),
            "same_site": str(morsel.get("samesite", "") or ""),
            "max_age": None,
            "expires": None,
        }

        # 解析 expires
        expires_str = morsel.get("expires", "")
        if expires_str:
            from email.utils import parsedate_to_datetime
            try:
                result["expires"] = parsedate_to_datetime(expires_str)
            except Exception:
                pass

        # 解析 max-age
        max_age_str = morsel.get("max-age", "")
        if max_age_str:
            try:
                result["max_age"] = int(max_age_str)
            except (ValueError, TypeError):
                pass

        return result

    return None


def _domain_match(cookie_domain: str, request_hostname: str) -> bool:
    """检查 cookie 的 domain 是否匹配请求的 hostname。

    规则：
    - 完全相同
    - cookie domain 以 . 开头，请求 hostname 以其结尾（包括子域名）
    - 请求 hostname 以 cookie domain 结尾（cookie domain 前面隐含 .）
    """
    cd = cookie_domain.lstrip(".")
    if cd == request_hostname:
        return True
    if request_hostname.endswith("." + cd):
        return True
    return False


def _path_match(cookie_path: str, request_path: str) -> bool:
    """检查 cookie 的 path 是否匹配请求 path。"""
    cp = (cookie_path or "/").rstrip("/")
    if not cp:
        cp = "/"
    rp = request_path.rstrip("/") or "/"
    return rp == cp or rp.startswith(cp + "/") or (cp == "/")


def save_cookies(response_headers: dict, url: str, session: Session):
    """从响应头中解析 Set-Cookie 并保存到数据库。

    Args:
        response_headers: 响应头字典。如果存在多条 Set-Cookie，
            以换行符分隔的字符串形式传入（key: "set-cookie"）。
        url: 发起请求的 URL
        session: 数据库会话
    """
    set_cookie_raw = ""
    # httpx Response.headers 转为 dict 后只保留最后一个 set-cookie，
    # 因此需要在 http_client 中提前把所有 set-cookie 用换行符拼接。
    for key, value in response_headers.items():
        if key.lower() == "set-cookie":
            set_cookie_raw = value
            break

    if not set_cookie_raw:
        return

    # 支持换行分隔的多条 Set-Cookie
    set_cookie_lines = set_cookie_raw.split("\n")

    for line in set_cookie_lines:
        line = line.strip()
        if not line:
            continue
        cookie_data = _parse_set_cookie(line, url)
        if not cookie_data:
            continue

        # Upsert: 同 name + domain 则更新
        existing = session.exec(
            select(CookieJar).where(
                CookieJar.name == cookie_data["name"],
                CookieJar.domain == cookie_data["domain"],
            )
        ).first()

        if existing:
            existing.value = cookie_data["value"]
            existing.path = cookie_data["path"]
            existing.expires = cookie_data["expires"]
            existing.max_age = cookie_data["max_age"]
            existing.http_only = cookie_data["http_only"]
            existing.secure = cookie_data["secure"]
            existing.same_site = cookie_data["same_site"]
        else:
            cj = CookieJar(
                name=cookie_data["name"],
                value=cookie_data["value"],
                domain=cookie_data["domain"],
                path=cookie_data["path"],
                expires=cookie_data["expires"],
                max_age=cookie_data["max_age"],
                http_only=cookie_data["http_only"],
                secure=cookie_data["secure"],
                same_site=cookie_data["same_site"],
            )
            session.add(cj)

    session.commit()


def get_matching_cookies(url: str, session: Session) -> str:
    """获取与请求 URL 匹配的 Cookie 字符串，用于自动携带。

    匹配规则：
    1. domain 匹配（含子域名）
    2. path 匹配
    3. 未过期
    4. Secure cookie 仅对 HTTPS 请求发送

    Args:
        url: 请求 URL
        session: 数据库会话

    Returns:
        str: "name1=value1; name2=value2" 格式的 Cookie 字符串
    """
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname or ""
    path = parsed_url.path or "/"
    is_secure = parsed_url.scheme == "https"

    now = datetime.now()
    all_cookies = session.exec(select(CookieJar)).all()

    matching = []
    for cookie in all_cookies:
        # 过期检查
        if cookie.expires and cookie.expires < now:
            continue

        # domain 匹配
        if not _domain_match(cookie.domain, hostname):
            continue

        # path 匹配
        if not _path_match(cookie.path, path):
            continue

        # secure 限制
        if cookie.secure and not is_secure:
            continue

        matching.append(f"{cookie.name}={cookie.value}")

    return "; ".join(matching)


def clear_all_cookies(session: Session) -> int:
    """清空所有 Cookie。

    Returns:
        int: 被删除的 cookie 数量
    """
    cookies = session.exec(select(CookieJar)).all()
    count = len(cookies)
    for c in cookies:
        session.delete(c)
    session.commit()
    return count


def delete_expired_cookies(session: Session) -> int:
    """删除所有已过期的 Cookie。

    Returns:
        int: 被删除的过期 cookie 数量
    """
    now = datetime.now()
    all_cookies = session.exec(select(CookieJar)).all()
    expired = [c for c in all_cookies if c.expires and c.expires < now]
    count = len(expired)
    for c in expired:
        session.delete(c)
    if count:
        session.commit()
    return count
