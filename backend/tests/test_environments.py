"""环境变量管理 API 测试"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import engine
from sqlmodel import SQLModel

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """每个测试前重置数据库"""
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield


def test_create_environment():
    """测试创建环境"""
    response = client.post(
        "/api/environments",
        json={"name": "测试环境", "variables": [{"key": "host", "value": "localhost"}]},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "测试环境"
    assert len(data["data"]["variables"]) == 1


def test_get_environments():
    """测试获取环境列表"""
    client.post("/api/environments", json={"name": "环境1"})
    client.post("/api/environments", json={"name": "环境2"})

    response = client.get("/api/environments")
    assert response.status_code == 200
    assert len(response.json()["data"]) == 2


def test_switch_environment():
    """测试切换当前环境"""
    r1 = client.post("/api/environments", json={"name": "环境A"})
    client.post("/api/environments", json={"name": "环境B"})
    env_id = r1.json()["data"]["id"]

    response = client.post(
        "/api/environments/current",
        json={"environment_id": env_id},
    )
    assert response.status_code == 200

    # 验证切换
    r3 = client.get("/api/environments")
    for env in r3.json()["data"]:
        if env["id"] == env_id:
            assert env["is_current"] is True
        else:
            assert env["is_current"] is False


def test_delete_environment():
    """测试删除环境"""
    r = client.post("/api/environments", json={"name": "待删除"})
    env_id = r.json()["data"]["id"]

    response = client.delete(f"/api/environments/{env_id}")
    assert response.status_code == 200

    r2 = client.get("/api/environments")
    assert len(r2.json()["data"]) == 0
