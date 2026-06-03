"""健康检查测试"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """测试健康检查接口"""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_root():
    """测试根路径（HTML 或 JSON 取决于 dist 是否存在）"""
    response = client.get("/")
    assert response.status_code == 200
    content_type = response.headers.get("content-type", "")
    if "text/html" in content_type:
        assert len(response.text) > 0
    else:
        data = response.json()
        assert data.get("name") is not None
