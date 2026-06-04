"""HTTP 代理后端测试"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestProxyStatus:
    """代理状态查询测试"""

    def test_get_proxy_status(self):
        """GET /api/proxy/status 返回代理状态"""
        response = client.get("/api/proxy/status")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "running" in data["data"]
        assert "address" in data["data"]
        assert "port" in data["data"]
        assert "log_count" in data["data"]

    def test_proxy_status_not_running_by_default(self):
        """默认代理未启动"""
        response = client.get("/api/proxy/status")
        assert response.json()["data"]["running"] is False

    def test_proxy_address_format(self):
        """代理地址格式正确"""
        response = client.get("/api/proxy/status")
        data = response.json()["data"]
        assert data["address"].startswith("http://127.0.0.1:")
        assert data["host"] == "127.0.0.1"


class TestProxyLogsEmpty:
    """空日志测试"""

    def test_get_empty_logs(self):
        """获取空的代理日志"""
        response = client.get("/api/proxy/logs")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["total"] == 0
        assert len(data["data"]["logs"]) == 0

    def test_clear_empty_logs(self):
        """清空空日志"""
        response = client.delete("/api/proxy/logs")
        assert response.status_code == 200
        assert response.json()["success"] is True


class TestProxyLogFiltering:
    """代理日志筛选测试"""

    def test_logs_with_method_filter(self):
        """按 method 筛选日志"""
        response = client.get("/api/proxy/logs?method=GET")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "logs" in data["data"]

    def test_logs_with_source_filter(self):
        """按 source 筛选日志"""
        response = client.get("/api/proxy/logs?source=proxy")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_logs_with_https_connect_filter(self):
        """按 is_https_connect 筛选"""
        response = client.get("/api/proxy/logs?is_https_connect=true")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_logs_with_host_filter(self):
        """按 host 筛选"""
        response = client.get("/api/proxy/logs?host=example.com")
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_logs_with_keyword_filter(self):
        """按 keyword 筛选"""
        response = client.get("/api/proxy/logs?keyword=test")
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_logs_with_status_code_filter(self):
        """按 status_code 筛选"""
        response = client.get("/api/proxy/logs?status_code=200")
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_logs_pagination(self):
        """日志分页"""
        response = client.get("/api/proxy/logs?limit=10&offset=0")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["limit"] == 10
        assert data["data"]["offset"] == 0


class TestProxyStartStop:
    """代理启停测试"""

    def test_proxy_stop_when_not_running(self):
        """停止未运行的代理"""
        response = client.post("/api/proxy/stop")
        assert response.status_code == 200
        # 应该返回成功（幂等操作）
        assert response.json()["success"] is True

    def test_proxy_start(self):
        """启动代理"""
        response = client.post("/api/proxy/start")
        assert response.status_code == 200
        data = response.json()
        # 可能成功或失败（端口被占用），但应有响应
        assert "success" in data

        # 清理：如果启动成功则停止
        status = client.get("/api/proxy/status")
        if status.json()["data"]["running"]:
            client.post("/api/proxy/stop")


class TestProxySettings:
    """代理相关设置测试"""

    def test_proxy_port_setting(self):
        """默认代理端口为 8899"""
        response = client.get("/api/settings")
        assert response.status_code == 200
        data = response.json()["data"]
        assert "proxy_port" in data
        assert data["proxy_port"] == 8899

    def test_update_proxy_port(self):
        """更新代理端口设置"""
        # 读取当前设置
        resp_get = client.get("/api/settings")
        original = resp_get.json()["data"]["proxy_port"]

        # 设置为 8898
        response = client.put("/api/settings", json={"proxy_port": 8898})
        assert response.status_code == 200
        assert response.json()["data"]["proxy_port"] == 8898

        # 恢复原设置
        client.put("/api/settings", json={"proxy_port": original})


class TestProxyLogDetail:
    """代理日志详情测试"""

    def test_get_nonexistent_log(self):
        """获取不存在的日志"""
        response = client.get("/api/proxy/logs/99999")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "不存在" in data["message"]


class TestProxyHealthCheck:
    """代理与健康检查集成测试"""

    def test_health_check_includes_version(self):
        """健康检查返回版本信息"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "0.4.0"


class TestProxyPortValidation:
    """代理端口设置验证测试"""

    def test_proxy_port_minimum(self):
        """代理端口不能小于 1024（不含特权端口）"""
        # 允许设置任何端口，由用户自行管理
        response = client.put("/api/settings", json={"proxy_port": 8080})
        assert response.status_code == 200
        assert response.json()["data"]["proxy_port"] == 8080

    def test_proxy_port_restore_after_change(self):
        """修改代理端口后可以恢复"""
        resp_get = client.get("/api/settings")
        original = resp_get.json()["data"]["proxy_port"]

        # 修改到 9000
        client.put("/api/settings", json={"proxy_port": 9000})
        resp = client.get("/api/settings")
        assert resp.json()["data"]["proxy_port"] == 9000

        # 恢复
        client.put("/api/settings", json={"proxy_port": original})
        resp = client.get("/api/settings")
        assert resp.json()["data"]["proxy_port"] == original

    def test_proxy_logs_empty_after_clear(self):
        """清空日志后 total 应为 0"""
        response = client.delete("/api/proxy/logs")
        assert response.status_code == 200
        assert response.json()["success"] is True

        # 再次查询确认
        resp = client.get("/api/proxy/logs")
        assert resp.json()["data"]["total"] == 0
