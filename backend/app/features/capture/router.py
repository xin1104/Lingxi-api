"""请求捕获路由"""

from fastapi import APIRouter
from app.schemas import ApiResponse

router = APIRouter(prefix="/api", tags=["请求捕获"])

# 内存中的捕获记录
_captured_requests: list[dict] = []


def add_capture_record(record: dict):
    """添加捕获记录"""
    _captured_requests.insert(0, record)
    # 限制内存中最多保存 1000 条
    if len(_captured_requests) > 1000:
        _captured_requests.pop()


@router.get("/capture/records", response_model=ApiResponse)
async def get_capture_records(limit: int = 100):
    """获取捕获记录"""
    return ApiResponse(data=_captured_requests[:limit])


@router.delete("/capture/records", response_model=ApiResponse)
async def clear_capture_records():
    """清空捕获记录"""
    _captured_requests.clear()
    return ApiResponse(message="捕获记录已清空")


@router.get("/capture/records/{record_id}", response_model=ApiResponse)
async def get_capture_record(record_id: int):
    """获取单条捕获记录"""
    for record in _captured_requests:
        if record.get("id") == record_id:
            return ApiResponse(data=record)
    return ApiResponse(success=False, message="记录不存在")
