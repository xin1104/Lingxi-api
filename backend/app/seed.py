"""插入示例数据"""

from sqlmodel import Session
from app.database import engine
from app.models import Collection, RequestItem, Environment, VariableItem, MockRoute


def seed_sample_data():
    """插入 Demo 示例数据"""
    with Session(engine) as session:
        # 检查是否已有数据
        existing = session.query(Collection).first()
        if existing:
            print("已有数据，跳过示例数据插入")
            return

        # 创建集合
        collection = Collection(
            name="本地测试接口",
            description="灵犀 API 调试示例集合",
        )
        session.add(collection)
        session.flush()

        # 请求 1：健康检查
        req1 = RequestItem(
            name="GET 健康检查",
            method="GET",
            url="http://127.0.0.1:17321/api/health",
            params=[],
            headers=[],
            auth={"type": "none", "token": "", "username": "", "password": "", "api_key": "", "api_key_header": "Authorization", "custom_header": "", "custom_value": ""},
            body_type="none",
            body={"type": "none", "raw": "", "json_data": None, "form_data": [], "urlencoded": [], "binary_path": ""},
            collection_id=collection.id,
            sort_order=1,
        )
        session.add(req1)

        # 请求 2：POST JSON 示例
        req2 = RequestItem(
            name="POST JSON 示例",
            method="POST",
            url="{{base_url}}/bm/api/v2/catalogs",
            params=[],
            headers=[{"key": "Content-Type", "value": "application/json", "enabled": True, "description": ""}],
            auth={"type": "none", "token": "", "username": "", "password": "", "api_key": "", "api_key_header": "Authorization", "custom_header": "", "custom_value": ""},
            body_type="json",
            body={
                "type": "json",
                "raw": "",
                "json_data": {"caseNo": "(2025)京0108民初75498号", "files": []},
                "form_data": [],
                "urlencoded": [],
                "binary_path": "",
            },
            collection_id=collection.id,
            sort_order=2,
        )
        session.add(req2)

        # 创建环境
        env = Environment(
            name="本地环境",
            is_current=True,
        )
        session.add(env)
        session.flush()

        # 环境变量
        var = VariableItem(
            key="base_url",
            value="http://127.0.0.1:8000",
            enabled=True,
            description="本地后端地址",
            environment_id=env.id,
        )
        session.add(var)

        # Mock 示例路由
        mock = MockRoute(
            method="GET",
            path="/api/user",
            status_code=200,
            headers={"Content-Type": "application/json"},
            body='{"id": 1, "name": "张三", "role": "developer"}',
            enabled=True,
        )
        session.add(mock)

        session.commit()
        print("示例数据已插入")

        # 输出插入的数据
        print(f"  集合: {collection.name}")
        print(f"  请求 1: {req1.name}")
        print(f"  请求 2: {req2.name}")
        print(f"  环境: {env.name} (当前)")
        print(f"  变量: {var.key} = {var.value}")
        print(f"  Mock: {mock.method} {mock.path}")
