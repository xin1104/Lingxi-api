"""集合管理路由"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Collection, Folder, RequestItem
from app.schemas import (
    ApiResponse,
    CollectionCreate,
    CollectionUpdate,
    FolderCreate,
    RequestItemCreate,
    RequestItemUpdate,
)

router = APIRouter(prefix="/api", tags=["集合管理"])


# ===== 集合 =====

@router.get("/collections", response_model=ApiResponse)
async def get_collections(session: Session = Depends(get_session)):
    """获取所有集合"""
    collections = session.exec(select(Collection).order_by(Collection.id)).all()
    return ApiResponse(data=[c.model_dump() for c in collections])


@router.post("/collections", response_model=ApiResponse)
async def create_collection(
    data: CollectionCreate,
    session: Session = Depends(get_session),
):
    """创建集合"""
    collection = Collection(name=data.name, description=data.description)
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return ApiResponse(data=collection.model_dump())


@router.put("/collections/{collection_id}", response_model=ApiResponse)
async def update_collection(
    collection_id: int,
    data: CollectionUpdate,
    session: Session = Depends(get_session),
):
    """更新集合"""
    collection = session.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="集合不存在")
    if data.name is not None:
        collection.name = data.name
    if data.description is not None:
        collection.description = data.description
    collection.updated_at = datetime.now()
    session.add(collection)
    session.commit()
    session.refresh(collection)
    return ApiResponse(data=collection.model_dump())


@router.delete("/collections/{collection_id}", response_model=ApiResponse)
async def delete_collection(
    collection_id: int,
    session: Session = Depends(get_session),
):
    """删除集合"""
    collection = session.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="集合不存在")
    # 删除集合下的所有请求
    requests = session.exec(select(RequestItem).where(RequestItem.collection_id == collection_id)).all()
    for req in requests:
        session.delete(req)
    # 删除集合下的所有文件夹
    folders = session.exec(select(Folder).where(Folder.collection_id == collection_id)).all()
    for folder in folders:
        session.delete(folder)
    session.delete(collection)
    session.commit()
    return ApiResponse(message="删除成功")


# ===== 文件夹 =====

@router.get("/collections/{collection_id}/folders", response_model=ApiResponse)
async def get_folders(
    collection_id: int,
    session: Session = Depends(get_session),
):
    """获取集合下的文件夹"""
    folders = session.exec(
        select(Folder).where(Folder.collection_id == collection_id)
    ).all()
    return ApiResponse(data=[f.model_dump() for f in folders])


@router.post("/folders", response_model=ApiResponse)
async def create_folder(
    data: FolderCreate,
    session: Session = Depends(get_session),
):
    """创建文件夹"""
    folder = Folder(
        name=data.name,
        collection_id=data.collection_id,
        parent_id=data.parent_id,
    )
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return ApiResponse(data=folder.model_dump())


@router.delete("/folders/{folder_id}", response_model=ApiResponse)
async def delete_folder(
    folder_id: int,
    session: Session = Depends(get_session),
):
    """删除文件夹"""
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="文件夹不存在")
    # 删除文件夹下的所有请求
    requests = session.exec(select(RequestItem).where(RequestItem.folder_id == folder_id)).all()
    for req in requests:
        session.delete(req)
    session.delete(folder)
    session.commit()
    return ApiResponse(message="删除成功")


# ===== 请求项 =====

@router.get("/collections/{collection_id}/requests", response_model=ApiResponse)
async def get_collection_requests(
    collection_id: int,
    session: Session = Depends(get_session),
):
    """获取集合下的请求"""
    requests = session.exec(
        select(RequestItem).where(RequestItem.collection_id == collection_id)
    ).all()
    return ApiResponse(data=[r.model_dump() for r in requests])


@router.get("/requests/{request_id}", response_model=ApiResponse)
async def get_request(
    request_id: int,
    session: Session = Depends(get_session),
):
    """获取单个请求"""
    request = session.get(RequestItem, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="请求不存在")
    return ApiResponse(data=request.model_dump())


@router.post("/requests", response_model=ApiResponse)
async def create_request(
    data: RequestItemCreate,
    session: Session = Depends(get_session),
):
    """创建请求"""
    request = RequestItem(
        name=data.name,
        method=data.method,
        url=data.url,
        params=[p.model_dump() for p in data.params],
        headers=[h.model_dump() for h in data.headers],
        auth=data.auth.model_dump(),
        body_type=data.body_type,
        body=data.body.model_dump(),
        pre_script=data.pre_script,
        test_script=data.test_script,
        collection_id=data.collection_id,
        folder_id=data.folder_id,
    )
    session.add(request)
    session.commit()
    session.refresh(request)
    return ApiResponse(data=request.model_dump())


@router.put("/requests/{request_id}", response_model=ApiResponse)
async def update_request(
    request_id: int,
    data: RequestItemUpdate,
    session: Session = Depends(get_session),
):
    """更新请求"""
    request = session.get(RequestItem, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="请求不存在")
    if data.name is not None:
        request.name = data.name
    if data.method is not None:
        request.method = data.method
    if data.url is not None:
        request.url = data.url
    if data.params is not None:
        request.params = [p.model_dump() for p in data.params]
    if data.headers is not None:
        request.headers = [h.model_dump() for h in data.headers]
    if data.auth is not None:
        request.auth = data.auth.model_dump()
    if data.body_type is not None:
        request.body_type = data.body_type
    if data.body is not None:
        request.body = data.body.model_dump()
    if data.pre_script is not None:
        request.pre_script = data.pre_script
    if data.test_script is not None:
        request.test_script = data.test_script
    request.updated_at = datetime.now()
    session.add(request)
    session.commit()
    session.refresh(request)
    return ApiResponse(data=request.model_dump())


@router.delete("/requests/{request_id}", response_model=ApiResponse)
async def delete_request(
    request_id: int,
    session: Session = Depends(get_session),
):
    """删除请求"""
    request = session.get(RequestItem, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="请求不存在")
    session.delete(request)
    session.commit()
    return ApiResponse(message="删除成功")
