"""集合管理 API 测试"""

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


def test_create_collection():
    """测试创建集合"""
    response = client.post(
        "/api/collections",
        json={"name": "测试集合", "description": "测试描述"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["name"] == "测试集合"


def test_get_collections():
    """测试获取集合列表"""
    # 先创建一个集合
    client.post("/api/collections", json={"name": "集合1"})
    client.post("/api/collections", json={"name": "集合2"})

    response = client.get("/api/collections")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 2


def test_update_collection():
    """测试更新集合"""
    # 创建
    r = client.post("/api/collections", json={"name": "原名称"})
    collection_id = r.json()["data"]["id"]

    # 更新
    response = client.put(
        f"/api/collections/{collection_id}",
        json={"name": "新名称"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["name"] == "新名称"


def test_delete_collection():
    """测试删除集合"""
    r = client.post("/api/collections", json={"name": "待删除"})
    collection_id = r.json()["data"]["id"]

    response = client.delete(f"/api/collections/{collection_id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # 确认已删除
    r2 = client.get("/api/collections")
    assert len(r2.json()["data"]) == 0


def test_create_request_in_collection():
    """测试在集合中创建请求"""
    r = client.post("/api/collections", json={"name": "集合"})
    collection_id = r.json()["data"]["id"]

    response = client.post(
        "/api/requests",
        json={
            "name": "测试请求",
            "method": "POST",
            "url": "http://example.com/api",
            "collection_id": collection_id,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["name"] == "测试请求"
    assert data["data"]["method"] == "POST"
