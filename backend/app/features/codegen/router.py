"""代码生成路由"""

from fastapi import APIRouter
from app.schemas import ApiResponse, CodegenResult, CodegenRequest
from app.features.codegen.service import generate_code

router = APIRouter(prefix="/api", tags=["代码生成"])


@router.post("/codegen", response_model=ApiResponse)
async def codegen(request: CodegenRequest):
    """生成代码片段

    支持语言:
    - curl: cURL 命令
    - python: Python requests
    - javascript: JavaScript fetch
    - node: Node.js axios
    - go: Go net/http
    """
    try:
        code = generate_code(request)
        return ApiResponse(
            data=CodegenResult(
                language=request.language,
                code=code,
            ).model_dump()
        )
    except Exception as e:
        return ApiResponse(success=False, message=f"代码生成失败: {str(e)}")
