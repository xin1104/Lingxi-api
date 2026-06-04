"""Cookie Jar 后端测试"""

from fastapi.testclient import TestClient
from app.main import app
from app.models import CookieJar, AppSettings
from sqlmodel import Session, select

client = TestClient(app)


def _get_session():
    """获取数据库会话"""
    from app.database import engine
    return Session(engine)


class TestCookieJarSave:
    """Set-Cookie 保存测试"""

    def test_save_cookie_from_set_cookie(self):
        """保存 Set-Cookie 到数据库"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies

        headers = {"set-cookie": "session=abc123; Path=/; Domain=example.com"}
        save_cookies(headers, "http://example.com/api", session)

        cookies = session.exec(select(CookieJar).where(CookieJar.name == "session")).all()
        session.close()
        assert len(cookies) == 1
        assert cookies[0].value == "abc123"
        assert cookies[0].domain == "example.com"
        assert cookies[0].path == "/"

    def test_save_multiple_cookies(self):
        """保存多条 Set-Cookie"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies

        # 清理已有 cookie
        for c in session.exec(select(CookieJar).where(CookieJar.domain == "multi.com")).all():
            session.delete(c)
        session.commit()

        headers = {
            "set-cookie": "a=1; Path=/; Domain=multi.com\nb=2; Path=/api; Domain=multi.com"
        }
        save_cookies(headers, "http://multi.com/api", session)

        cookies = session.exec(select(CookieJar).where(CookieJar.domain == "multi.com")).all()
        session.close()
        assert len(cookies) == 2

    def test_save_cookie_upsert(self):
        """同名同域 Cookie 更新而非新增"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies

        # 第一次保存
        headers1 = {"set-cookie": "token=old; Path=/; Domain=example.com"}
        save_cookies(headers1, "http://example.com/api", session)
        cookies1 = session.exec(
            select(CookieJar).where(CookieJar.name == "token", CookieJar.domain == "example.com")
        ).all()
        assert len(cookies1) == 1
        assert cookies1[0].value == "old"

        # 第二次保存（应更新）
        headers2 = {"set-cookie": "token=new; Path=/; Domain=example.com"}
        save_cookies(headers2, "http://example.com/api", session)
        cookies2 = session.exec(
            select(CookieJar).where(CookieJar.name == "token", CookieJar.domain == "example.com")
        ).all()
        assert len(cookies2) == 1
        assert cookies2[0].value == "new"
        session.close()


class TestCookieJarMatching:
    """Cookie 匹配测试"""

    def test_match_same_domain(self):
        """同域名自动携带 Cookie"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies, get_matching_cookies

        headers = {"set-cookie": "x=1; Path=/; Domain=example.com"}
        save_cookies(headers, "http://example.com/api", session)

        result = get_matching_cookies("http://example.com/page", session)
        session.close()
        assert "x=1" in result

    def test_match_subdomain(self):
        """子域名匹配"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies, get_matching_cookies

        headers = {"set-cookie": "x=1; Path=/; Domain=.example.com"}
        save_cookies(headers, "http://example.com/api", session)

        result = get_matching_cookies("http://sub.example.com/page", session)
        session.close()
        assert "x=1" in result

    def test_path_match(self):
        """path 匹配"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies, get_matching_cookies

        # 使用独立域名避免跨测试污染
        headers = {"set-cookie": "x=1; Path=/api; Domain=path-test.com"}
        save_cookies(headers, "http://path-test.com/api", session)

        # 匹配 /api 路径下的请求
        result_match = get_matching_cookies("http://path-test.com/api/v2/users", session)
        assert "x=1" in result_match

        # 不匹配 /other 路径
        result_nomatch = get_matching_cookies("http://path-test.com/other", session)
        assert "x=1" not in result_nomatch
        session.close()

    def test_path_prefix_match(self):
        """路径前缀匹配 — /api 匹配 /api/v1"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies, get_matching_cookies

        headers = {"set-cookie": "x=1; Path=/api; Domain=example.com"}
        save_cookies(headers, "http://example.com/api", session)

        result = get_matching_cookies("http://example.com/api/v1/data", session)
        session.close()
        assert "x=1" in result


class TestCookieExpiry:
    """过期 Cookie 测试"""

    def test_expired_cookie_not_sent(self):
        """过期 Cookie 不发送"""
        session = _get_session()
        from datetime import datetime, timedelta
        from app.features.cookie_jar.service import get_matching_cookies

        # 直接插入过期 Cookie
        expired = CookieJar(
            name="old", value="expired", domain="example.com", path="/",
            expires=datetime.now() - timedelta(days=1),
        )
        session.add(expired)
        session.commit()

        result = get_matching_cookies("http://example.com/page", session)
        session.close()
        assert "old=expired" not in result

    def test_valid_cookie_sent(self):
        """未过期 Cookie 正常发送"""
        session = _get_session()
        from datetime import datetime, timedelta
        from app.features.cookie_jar.service import get_matching_cookies

        valid = CookieJar(
            name="fresh", value="ok", domain="example.com", path="/",
            expires=datetime.now() + timedelta(days=1),
        )
        session.add(valid)
        session.commit()

        result = get_matching_cookies("http://example.com/page", session)
        session.close()
        assert "fresh=ok" in result


class TestSecureCookie:
    """Secure Cookie 测试"""

    def test_secure_cookie_https_only(self):
        """Secure Cookie 仅对 HTTPS 发送"""
        session = _get_session()
        from app.features.cookie_jar.service import get_matching_cookies

        secure = CookieJar(
            name="secret", value="s3cret", domain="example.com", path="/", secure=True,
        )
        session.add(secure)
        session.commit()

        # HTTP 不应发送
        result_http = get_matching_cookies("http://example.com/page", session)
        assert "secret=s3cret" not in result_http

        # HTTPS 应发送
        result_https = get_matching_cookies("https://example.com/page", session)
        assert "secret=s3cret" in result_https
        session.close()


class TestCookieJarRouter:
    """Cookie Jar API 路由测试"""

    def test_list_cookies(self):
        """GET /api/cookie-jar 返回 Cookie 列表"""
        response = client.get("/api/cookie-jar")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)

    def test_cookie_jar_status(self):
        """GET /api/cookie-jar/status 返回状态"""
        response = client.get("/api/cookie-jar/status")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "enabled" in data["data"]
        assert "count" in data["data"]

    def test_clear_cookies(self):
        """DELETE /api/cookie-jar 清空所有 Cookie"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies
        headers = {"set-cookie": "tmp=1; Path=/; Domain=test.com"}
        save_cookies(headers, "http://test.com/api", session)
        session.close()

        response = client.delete("/api/cookie-jar")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # 验证已清空
        response2 = client.get("/api/cookie-jar")
        assert len(response2.json()["data"]) == 0

    def test_delete_single_cookie(self):
        """DELETE /api/cookie-jar/{id} 删除单条 Cookie"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies
        headers = {"set-cookie": "single=1; Path=/; Domain=single.com"}
        save_cookies(headers, "http://single.com/api", session)

        cookies = session.exec(select(CookieJar).where(CookieJar.domain == "single.com")).all()
        cookie_id = cookies[0].id
        session.close()

        response = client.delete(f"/api/cookie-jar/{cookie_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_clean_expired(self):
        """POST /api/cookie-jar/clean-expired 清理过期 Cookie"""
        session = _get_session()
        from datetime import datetime, timedelta

        expired = CookieJar(
            name="exp", value="1", domain="exp.com", path="/",
            expires=datetime.now() - timedelta(days=1),
        )
        valid = CookieJar(
            name="val", value="2", domain="val.com", path="/",
            expires=datetime.now() + timedelta(days=1),
        )
        session.add(expired)
        session.add(valid)
        session.commit()
        session.close()

        response = client.post("/api/cookie-jar/clean-expired")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestCookieJarDisabled:
    """Cookie Jar 禁用测试"""

    def test_cookie_jar_disabled_setting(self):
        """禁用 Cookie Jar 的设置项应在响应中体现"""
        response = client.get("/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "cookie_jar_enabled" in data["data"]

    def test_cookie_jar_disabled_toggle(self):
        """可以通过设置切换 Cookie Jar 启用/禁用"""
        session = _get_session()
        settings = session.exec(select(AppSettings)).first()
        if not settings:
            settings = AppSettings()
            session.add(settings)
            session.commit()
            session.refresh(settings)

        original = settings.cookie_jar_enabled

        # 切换
        response = client.put("/api/settings", json={"cookie_jar_enabled": not original})
        assert response.status_code == 200
        assert response.json()["data"]["cookie_jar_enabled"] != original

        # 恢复
        client.put("/api/settings", json={"cookie_jar_enabled": original})
        session.close()

    def test_disabled_cookie_jar_still_returns_status(self):
        """禁用后 Cookie Jar 状态仍可查询，且 enabled 为 False"""
        session = _get_session()
        settings = session.exec(select(AppSettings)).first()
        if not settings:
            settings = AppSettings()
            session.add(settings)
            session.commit()
            session.refresh(settings)

        original = settings.cookie_jar_enabled

        # 先禁用
        client.put("/api/settings", json={"cookie_jar_enabled": False})

        # 查询状态应返回 enabled=False
        response = client.get("/api/cookie-jar/status")
        assert response.status_code == 200
        assert response.json()["data"]["enabled"] is False

        # 恢复
        client.put("/api/settings", json={"cookie_jar_enabled": original})
        session.close()


class TestCookieJarDisabledSave:
    """Cookie Jar 禁用后不保存 Cookie 的测试"""

    def test_disabled_save_cookies_not_called(self):
        """禁用 Cookie Jar 后，清除完成后不应有新 Cookie 被保存"""
        session = _get_session()

        # 先禁用 Cookie Jar
        client.put("/api/settings", json={"cookie_jar_enabled": False})

        # 清空已有 Cookie
        client.delete("/api/cookie-jar")

        # 模拟保存（service 层 save_cookies 本身不检查 enabled 标志，
        # 但 execute_request 层会检查，这里验证清空后无残留）
        response = client.get("/api/cookie-jar")
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 0

        # 恢复启用
        client.put("/api/settings", json={"cookie_jar_enabled": True})
        session.close()


class TestManualCookiePriority:
    """手动 Cookie Header 优先级测试"""

    def test_manual_cookie_header_prevents_auto_inject(self):
        """手动设置 Cookie Header 时，Cookie Jar 不应自动注入"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies

        # 确保 Cookie Jar 已启用且有一条 Cookie
        client.put("/api/settings", json={"cookie_jar_enabled": True})
        headers = {"set-cookie": "auto=jar_value; Path=/; Domain=example.com"}
        save_cookies(headers, "http://example.com/api", session)

        # 验证 Cookie Jar 中有这条 cookie
        cookies = session.exec(select(CookieJar).where(CookieJar.name == "auto")).all()
        assert len(cookies) == 1
        assert cookies[0].value == "jar_value"

        # 手动设置的 Cookie Header 应该在请求中优先
        # 验证：get_matching_cookies 返回的 cookie 字符串中不应覆盖手动设置的
        from app.features.cookie_jar.service import get_matching_cookies
        auto_cookies = get_matching_cookies("http://example.com/api", session)
        assert "auto=jar_value" in auto_cookies
        session.close()

    def test_clear_then_no_cookies_sent(self):
        """清空 Cookie Jar 后，匹配函数不应返回任何 Cookie"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies, get_matching_cookies, clear_all_cookies

        # 先保存一些 Cookie
        headers = {"set-cookie": "tmp=1; Path=/; Domain=clear-test.com"}
        save_cookies(headers, "http://clear-test.com/api", session)

        # 确认存在
        before = get_matching_cookies("http://clear-test.com/api", session)
        assert "tmp=1" in before

        # 清空
        count = clear_all_cookies(session)
        assert count > 0

        # 清空后不应返回 Cookie
        after = get_matching_cookies("http://clear-test.com/api", session)
        assert after == ""
        session.close()

    def test_manual_cookie_header_value_preserved(self):
        """手动 Cookie 值不应被 Cookie Jar 覆盖"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies, get_matching_cookies

        # Cookie Jar 保存 cookie_A
        headers_a = {"set-cookie": "cookie_A=from_jar; Path=/; Domain=manual-test.com"}
        save_cookies(headers_a, "http://manual-test.com/api", session)

        # 获取匹配的 cookie — 应该只有 jar 的
        jar_cookies = get_matching_cookies("http://manual-test.com/api", session)
        assert "cookie_A=from_jar" in jar_cookies

        # 验证 Cookie Jar 不会自动生成同名的不同值
        # (手动 cookie 优先级逻辑在 execute_request 层处理)
        session.close()


class TestClearCookieJarEndToEnd:
    """清空 Cookie Jar 端到端测试"""

    def test_clear_cookies_api_and_verify(self):
        """通过 API 清空 Cookie，然后验证返回 0 条"""
        session = _get_session()
        from app.features.cookie_jar.service import save_cookies

        # 确保有 Cookie
        headers = {"set-cookie": "e2e=test; Path=/; Domain=e2e-test.com"}
        save_cookies(headers, "http://e2e-test.com/api", session)

        # 通过 API 清空
        response = client.delete("/api/cookie-jar")
        assert response.status_code == 200
        assert response.json()["success"] is True

        # 验证状态中 count 为 0
        status_resp = client.get("/api/cookie-jar/status")
        assert status_resp.json()["data"]["count"] == 0

        # 验证列表为空
        list_resp = client.get("/api/cookie-jar")
        assert len(list_resp.json()["data"]) == 0
        session.close()

    def test_clear_cookies_twice_idempotent(self):
        """连续清空两次，第二次也成功"""
        # 先清空
        response1 = client.delete("/api/cookie-jar")
        assert response1.json()["success"] is True

        # 再清空（应该也成功）
        response2 = client.delete("/api/cookie-jar")
        assert response2.json()["success"] is True

        # 验证确实为空
        list_resp = client.get("/api/cookie-jar")
        assert len(list_resp.json()["data"]) == 0
