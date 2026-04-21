from database import SessionLocal, engine, Base
import models
from schemas import UserCreate
from crud_auth import create_user, get_user_by_username

# 只有在初次启动没有表结构时才需要这段: 
# Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    # 创建表（如果是热替换架构会把新建的模型如 RBACUser 生效）
    Base.metadata.create_all(bind=engine)
    
    admin_user = get_user_by_username(db, "admin")
    if not admin_user:
        create_user(db, UserCreate(username="admin", password="password123", role="SUPER_ADMIN"))
        print("✅ 播种超级管理员成功：admin / password123")
    
    operator_user = get_user_by_username(db, "devops")
    if not operator_user:
        create_user(db, UserCreate(username="devops", password="password123", role="OPERATOR"))
        print("✅ 播种执行人员成功：devops / password123")

    viewer_user = get_user_by_username(db, "guest")
    if not viewer_user:
        create_user(db, UserCreate(username="guest", password="password123", role="VIEWER"))
        print("✅ 播种访客账户成功：guest / password123")

    db.close()

if __name__ == "__main__":
    print("🚀 开始初始化 RBAC 安全底座库...")
    seed_users()
