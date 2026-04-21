"""
数据库配置与基类，使用 SQLAlchemy。
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 针对 SQLite (开发环境)
SQLALCHEMY_DATABASE_URL = "sqlite:///./ops.db"

# 创建引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
