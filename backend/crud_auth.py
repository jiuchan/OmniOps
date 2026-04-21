from sqlalchemy.orm import Session
from models import RBACUser
from schemas import UserCreate
from auth_utils import get_password_hash

def get_user_by_username(db: Session, username: str):
    return db.query(RBACUser).filter(RBACUser.username == username).first()

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = RBACUser(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RBACUser).offset(skip).limit(limit).all()

def get_user_by_id(db: Session, user_id: int):
    return db.query(RBACUser).filter(RBACUser.id == user_id).first()

def update_user_role(db: Session, user_id: int, new_role: str):
    db_user = db.query(RBACUser).filter(RBACUser.id == user_id).first()
    if db_user:
        db_user.role = new_role
        
        # [双轨制升级] 同步刷新到高阶 RBAC 关联池
        from models import RBACRole
        matched_role_obj = db.query(RBACRole).filter(RBACRole.code == new_role).first()
        if matched_role_obj:
            db_user.roles = [matched_role_obj] # 单选机制下整体覆盖赋予新模型
        else:
            db_user.roles = [] # 匹配不到退回为彻底底权
            
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(RBACUser).filter(RBACUser.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user


def update_user(db: Session, user_id: int, user_update):
    db_user = db.query(RBACUser).filter(RBACUser.id == user_id).first()
    if not db_user: return None
    if user_update.username: db_user.username = user_update.username
    if user_update.password: 
        db_user.hashed_password = get_password_hash(user_update.password)
    
    if user_update.role: 
        db_user.role = user_update.role
        from models import RBACRole
        matched_role = db.query(RBACRole).filter(RBACRole.code == user_update.role).first()
        if matched_role: db_user.roles = [matched_role]
        else: db_user.roles = []
        
    if user_update.groups is not None:
        from models import RBACGroup
        db_user.groups = db.query(RBACGroup).filter(RBACGroup.id.in_(user_update.groups)).all()
        
    db.commit()
    db.refresh(db_user)
    return db_user
