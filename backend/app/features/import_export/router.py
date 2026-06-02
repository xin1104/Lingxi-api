"""导入导出路由"""

import json
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models import Collection, RequestItem, Environment, VariableItem
from app.schemas import (
    ApiResponse,
    CurlImport,
    SendRequestInput,
)
from app.features.import_export.curl_parser import parse_curl, generate_curl


class ExportPostmanInput(BaseModel):
    """Postman 导出输入"""
    collection_id: int


class PostmanImportData(BaseModel):
    """Postman 导入数据"""
    data: dict


class OpenApiImportData(BaseModel):
    """OpenAPI 导入数据"""
    data: dict

router = APIRouter(prefix="/api", tags=["导入导出"])


@router.post("/import/curl", response_model=ApiResponse)
async def import_curl(data: CurlImport):
    """导入 cURL 命令"""
    try:
        request = parse_curl(data.curl_command)
        return ApiResponse(
            data=request.model_dump(),
            message="解析成功",
        )
    except ValueError as e:
        return ApiResponse(success=False, message=str(e))


@router.post("/import/postman", response_model=ApiResponse)
async def import_postman(
    import_data: PostmanImportData,
    session: Session = Depends(get_session),
):
    """导入 Postman Collection v2.1"""
    try:
        data = import_data.data
        # 基础解析
        info = data.get("info", {})
        collection_name = info.get("name", "导入的集合")

        # 创建集合
        collection = Collection(name=collection_name, description=info.get("description", ""))
        session.add(collection)
        session.commit()
        session.refresh(collection)

        # 解析请求
        items = data.get("item", [])
        imported_count = 0

        for item in items:
            if "request" in item:
                _import_postman_request(item, collection.id, session)
                imported_count += 1
            elif "item" in item:
                # 文件夹
                for sub_item in item.get("item", []):
                    if "request" in sub_item:
                        _import_postman_request(sub_item, collection.id, session)
                        imported_count += 1

        session.commit()

        return ApiResponse(
            data={
                "collection_id": collection.id,
                "imported_count": imported_count,
            },
            message=f"成功导入 {imported_count} 个请求",
        )
    except Exception as e:
        return ApiResponse(success=False, message=f"导入失败: {str(e)}")


def _import_postman_request(item: dict, collection_id: int, session: Session):
    """导入单个 Postman 请求"""
    request = item.get("request", {})
    method = request.get("method", "GET").upper()
    url_data = request.get("url", {})

    # 构建 URL
    if isinstance(url_data, str):
        url = url_data
    else:
        raw = url_data.get("raw", "")
        url = raw

    # 构建 Headers
    headers = []
    for header in request.get("header", []):
        headers.append({
            "key": header.get("key", ""),
            "value": header.get("value", ""),
            "enabled": not header.get("disabled", False),
        })

    # 构建 Body
    body_data = request.get("body", {})
    body_type = body_data.get("mode", "none")
    body = {"type": body_type}

    if body_type == "raw":
        body["raw"] = body_data.get("raw", "")
    elif body_type == "urlencoded":
        body["urlencoded"] = [
            {"key": p.get("key", ""), "value": p.get("value", ""), "enabled": True}
            for p in body_data.get("urlencoded", [])
        ]
    elif body_type == "formdata":
        body["form_data"] = [
            {"key": p.get("key", ""), "value": p.get("value", ""), "enabled": True}
            for p in body_data.get("formdata", [])
        ]

    # 创建请求
    db_request = RequestItem(
        name=item.get("name", "未命名请求"),
        method=method,
        url=url,
        headers=headers,
        body_type=body_type,
        body=body,
        collection_id=collection_id,
    )
    session.add(db_request)


@router.post("/import/openapi", response_model=ApiResponse)
async def import_openapi(
    import_data: OpenApiImportData,
    session: Session = Depends(get_session),
):
    """导入 OpenAPI 3.0 基础版"""
    try:
        data = import_data.data
        info = data.get("info", {})
        collection_name = info.get("title", "导入的 API")

        # 创建集合
        collection = Collection(name=collection_name, description=info.get("description", ""))
        session.add(collection)
        session.commit()
        session.refresh(collection)

        # 获取服务器地址
        servers = data.get("servers", [])
        base_url = servers[0].get("url", "") if servers else ""

        # 解析路径
        paths = data.get("paths", {})
        imported_count = 0

        for path, methods in paths.items():
            for method, details in methods.items():
                if method.upper() in ("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"):
                    url = f"{base_url}{path}" if base_url else path
                    request = RequestItem(
                        name=details.get("summary", f"{method.upper()} {path}"),
                        method=method.upper(),
                        url=url,
                        collection_id=collection.id,
                    )
                    session.add(request)
                    imported_count += 1

        session.commit()

        return ApiResponse(
            data={
                "collection_id": collection.id,
                "imported_count": imported_count,
            },
            message=f"成功导入 {imported_count} 个请求",
        )
    except Exception as e:
        return ApiResponse(success=False, message=f"导入失败: {str(e)}")


@router.post("/export/curl", response_model=ApiResponse)
async def export_curl(request: SendRequestInput):
    """导出当前请求为 cURL"""
    try:
        curl = generate_curl(request)
        return ApiResponse(data=curl)
    except Exception as e:
        return ApiResponse(success=False, message=f"生成失败: {str(e)}")


@router.post("/export/postman", response_model=ApiResponse)
async def export_postman(
    export_input: ExportPostmanInput,
    session: Session = Depends(get_session),
):
    """导出集合为 Postman Collection"""
    collection_id = export_input.collection_id
    collection = session.get(Collection, collection_id)
    if not collection:
        return ApiResponse(success=False, message="集合不存在")

    requests = session.exec(
        select(RequestItem).where(RequestItem.collection_id == collection_id)
    ).all()

    items = []
    for req in requests:
        item = {
            "name": req.name,
            "request": {
                "method": req.method,
                "header": [
                    {"key": h["key"], "value": h["value"]}
                    for h in (req.headers or [])
                ],
                "url": {
                    "raw": req.url,
                },
            },
        }
        if req.body_type == "json":
            item["request"]["body"] = {
                "mode": "raw",
                "raw": json.dumps(req.body.get("json_data", {})),
                "options": {"raw": {"language": "json"}},
            }
        items.append(item)

    postman_data = {
        "info": {
            "name": collection.name,
            "description": collection.description,
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        "item": items,
    }

    return ApiResponse(data=postman_data)


@router.get("/export/backup", response_model=ApiResponse)
async def export_backup(session: Session = Depends(get_session)):
    """导出所有本地数据为备份"""
    collections = session.exec(select(Collection)).all()
    requests = session.exec(select(RequestItem)).all()
    environments = session.exec(select(Environment)).all()
    variables = session.exec(select(VariableItem)).all()

    backup = {
        "version": "1.0",
        "exported_at": datetime.now().isoformat(),
        "collections": [c.model_dump() for c in collections],
        "requests": [r.model_dump() for r in requests],
        "environments": [e.model_dump() for e in environments],
        "variables": [v.model_dump() for v in variables],
    }

    return ApiResponse(data=backup)
