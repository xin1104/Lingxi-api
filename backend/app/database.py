"""数据库初始化和会话管理"""

from sqlmodel import SQLModel, Session, create_engine
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, echo=False)


def init_db():
    """初始化数据库表"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """获取数据库会话"""
    with Session(engine) as session:
        yield session
