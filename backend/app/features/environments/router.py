"""环境变量管理路由"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Environment, VariableItem
from app.schemas import (
    ApiResponse,
    EnvironmentCreate,
    EnvironmentUpdate,
    VariableItemCreate,
    VariableItemUpdate,
    SetCurrentEnvironment,
)

router = APIRouter(prefix="/api", tags=["环境管理"])


@router.get("/environments", response_model=ApiResponse)
async def get_environments(session: Session = Depends(get_session)):
    """获取所有环境"""
    environments = session.exec(select(Environment)).all()
    result = []
    for env in environments:
        variables = session.exec(
            select(VariableItem).where(VariableItem.environment_id == env.id)
        ).all()
        env_data = env.model_dump()
        env_data["variables"] = [v.model_dump() for v in variables]
        result.append(env_data)
    return ApiResponse(data=result)


@router.post("/environments", response_model=ApiResponse)
async def create_environment(
    data: EnvironmentCreate,
    session: Session = Depends(get_session),
):
    """创建环境"""
    environment = Environment(name=data.name)
    session.add(environment)
    session.commit()
    session.refresh(environment)

    # 创建关联的变量
    for var in data.variables:
        variable = VariableItem(
            key=var.key,
            value=var.value,
            enabled=var.enabled,
            description=var.description,
            environment_id=environment.id,
            is_global=var.is_global,
        )
        session.add(variable)
    session.commit()

    # 返回环境及变量
    variables = session.exec(
        select(VariableItem).where(VariableItem.environment_id == environment.id)
    ).all()
    env_data = environment.model_dump()
    env_data["variables"] = [v.model_dump() for v in variables]
    return ApiResponse(data=env_data)


@router.put("/environments/{env_id}", response_model=ApiResponse)
async def update_environment(
    env_id: int,
    data: EnvironmentUpdate,
    session: Session = Depends(get_session),
):
    """更新环境"""
    environment = session.get(Environment, env_id)
    if not environment:
        raise HTTPException(status_code=404, detail="环境不存在")
    if data.name is not None:
        environment.name = data.name
    session.add(environment)
    session.commit()
    session.refresh(environment)
    return ApiResponse(data=environment.model_dump())


@router.delete("/environments/{env_id}", response_model=ApiResponse)
async def delete_environment(
    env_id: int,
    session: Session = Depends(get_session),
):
    """删除环境"""
    environment = session.get(Environment, env_id)
    if not environment:
        raise HTTPException(status_code=404, detail="环境不存在")
    # 删除关联的变量
    variables = session.exec(
        select(VariableItem).where(VariableItem.environment_id == env_id)
    ).all()
    for var in variables:
        session.delete(var)
    session.delete(environment)
    session.commit()
    return ApiResponse(message="删除成功")


@router.post("/environments/current", response_model=ApiResponse)
async def set_current_environment(
    data: SetCurrentEnvironment,
    session: Session = Depends(get_session),
):
    """设置当前环境"""
    # 取消所有当前环境
    environments = session.exec(select(Environment)).all()
    for env in environments:
        env.is_current = False
        session.add(env)
    # 设置新的当前环境
    target = session.get(Environment, data.environment_id)
    if not target:
        raise HTTPException(status_code=404, detail="环境不存在")
    target.is_current = True
    session.add(target)
    session.commit()
    return ApiResponse(message="切换成功")


# ===== 变量管理 =====

@router.post("/environments/{env_id}/variables", response_model=ApiResponse)
async def create_variable(
    env_id: int,
    data: VariableItemCreate,
    session: Session = Depends(get_session),
):
    """创建变量"""
    variable = VariableItem(
        key=data.key,
        value=data.value,
        enabled=data.enabled,
        description=data.description,
        environment_id=env_id,
        is_global=data.is_global,
    )
    session.add(variable)
    session.commit()
    session.refresh(variable)
    return ApiResponse(data=variable.model_dump())


@router.put("/variables/{var_id}", response_model=ApiResponse)
async def update_variable(
    var_id: int,
    data: VariableItemUpdate,
    session: Session = Depends(get_session),
):
    """更新变量"""
    variable = session.get(VariableItem, var_id)
    if not variable:
        raise HTTPException(status_code=404, detail="变量不存在")
    if data.key is not None:
        variable.key = data.key
    if data.value is not None:
        variable.value = data.value
    if data.enabled is not None:
        variable.enabled = data.enabled
    if data.description is not None:
        variable.description = data.description
    session.add(variable)
    session.commit()
    session.refresh(variable)
    return ApiResponse(data=variable.model_dump())


@router.delete("/variables/{var_id}", response_model=ApiResponse)
async def delete_variable(
    var_id: int,
    session: Session = Depends(get_session),
):
    """删除变量"""
    variable = session.get(VariableItem, var_id)
    if not variable:
        raise HTTPException(status_code=404, detail="变量不存在")
    session.delete(variable)
    session.commit()
    return ApiResponse(message="删除成功")


@router.get("/variables/current", response_model=ApiResponse)
async def get_current_variables(session: Session = Depends(get_session)):
    """获取当前环境的变量（包括全局变量）"""
    # 获取当前环境
    current_env = session.exec(
        select(Environment).where(Environment.is_current)
    ).first()

    variables = {}

    # 全局变量
    global_vars = session.exec(
        select(VariableItem).where(VariableItem.is_global, VariableItem.enabled)
    ).all()
    for var in global_vars:
        variables[var.key] = var.value

    # 当前环境变量
    if current_env:
        env_vars = session.exec(
            select(VariableItem).where(
                VariableItem.environment_id == current_env.id,
                VariableItem.enabled,
            )
        ).all()
        for var in env_vars:
            variables[var.key] = var.value

    return ApiResponse(data=variables)
