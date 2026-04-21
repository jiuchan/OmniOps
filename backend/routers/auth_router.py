from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import crud_auth
import crud_rbac
import schemas
from auth_utils import verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("username")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud_auth.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

def require_role(roles: List[str]):
    """依赖校验器：只允许包含在被准许角色列表中的用户通过"""
    def role_checker(current_user: schemas.UserOut = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Requires one of: {roles}"
            )
        return current_user
    return role_checker

def require_permission(expected_perm: str):
    """进阶级动态资源防线：检验申请者(当前会话 Token 归属者)是否具备触碰某资源的授权元数据"""
    def permission_checker(current_user: schemas.UserOut = Depends(get_current_user), db: Session = Depends(get_db)):
        perms = crud_rbac.get_user_permissions(db, current_user.id)
        if expected_perm not in perms and "system:all" not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Missing Permission [{expected_perm}]"
            )
        # 为配合后续渲染，将收集到的权限集合回写至请求上下文传递给业务控制器 (若需要)
        setattr(current_user, 'dynamic_permissions', perms)
        return current_user
    return permission_checker

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud_auth.get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"username": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: schemas.UserOut = Depends(get_current_user)):
    """获取当前已登录用户信息"""
    return current_user

# --- RBAC 用户管理 API (仅限 SUPER_ADMIN) ---
@router.get("/users", response_model=List[schemas.UserOut], dependencies=[Depends(require_role(["SUPER_ADMIN"]))])
def get_all_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_auth.get_users(db, skip=skip, limit=limit)

@router.post("/users", response_model=schemas.UserOut, dependencies=[Depends(require_role(["SUPER_ADMIN"]))])
def create_new_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud_auth.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud_auth.create_user(db=db, user=user)

@router.put("/users/{user_id}/role", response_model=schemas.UserOut, dependencies=[Depends(require_role(["SUPER_ADMIN"]))])
def update_user_role(user_id: int, role: str, db: Session = Depends(get_db)):
    target_user = crud_auth.get_user_by_id(db, user_id)
    if target_user and target_user.username == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="The 'admin' user role is locked and immutable")
    updated = crud_auth.update_user_role(db, user_id=user_id, new_role=role)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated

@router.delete("/users/{user_id}", response_model=schemas.UserOut, dependencies=[Depends(require_role(["SUPER_ADMIN"]))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    target_user = crud_auth.get_user_by_id(db, user_id)
    if target_user and target_user.username == "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="The 'admin' user cannot be deleted")
    deleted = crud_auth.delete_user(db, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return deleted

# --- RBAC 全局字典动态挂载路由 ---
@router.get("/permissions", response_model=List[schemas.PermissionSchema])
def list_permissions(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    """下发全站合法能力点地图"""
    return crud_rbac.get_permissions(db, skip=skip, limit=limit)

@router.post("/permissions", response_model=schemas.PermissionSchema)
def bind_permission(perm: schemas.PermissionCreate, db: Session = Depends(get_db)):
    """向系统中埋点注入新的权限识别"""
    return crud_rbac.create_permission(db=db, perm=perm)

@router.get("/roles", response_model=List[schemas.RoleSchema])
def list_roles(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """查询目前系统中打包组合出来的角色卡"""
    return crud_rbac.get_roles(db, skip=skip, limit=limit)

@router.post("/roles", response_model=schemas.RoleSchema)
def build_role(role: schemas.RoleCreate, db: Session = Depends(get_db)):
    return crud_rbac.create_role(db=db, role=role)

@router.get("/groups", response_model=List[schemas.GroupSchema])
def list_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_rbac.get_groups(db, skip=skip, limit=limit)

@router.post("/groups", response_model=schemas.GroupSchema)
def build_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    return crud_rbac.create_group(db=db, group=group)

@router.put("/roles/{role_id}", response_model=schemas.RoleSchema, dependencies=[Depends(require_permission("system:all"))])
def update_role_endpoint(role_id: int, role: schemas.RoleCreate, db: Session = Depends(get_db)):
    res = crud_rbac.update_role(db, role_id, role)
    if not res: raise HTTPException(status_code=404, detail="Role not found")
    return res

@router.delete("/roles/{role_id}", dependencies=[Depends(require_permission("system:all"))])
def delete_role_endpoint(role_id: int, db: Session = Depends(get_db)):
    res = crud_rbac.delete_role(db, role_id)
    if not res: raise HTTPException(status_code=404, detail="Role not found")
    return {"status": "ok"}

@router.put("/groups/{group_id}", response_model=schemas.GroupSchema, dependencies=[Depends(require_permission("system:all"))])
def update_group_endpoint(group_id: int, group: schemas.GroupCreate, db: Session = Depends(get_db)):
    res = crud_rbac.update_group(db, group_id, group)
    if not res: raise HTTPException(status_code=404, detail="Group not found")
    return res

@router.delete("/groups/{group_id}", dependencies=[Depends(require_permission("system:all"))])
def delete_group_endpoint(group_id: int, db: Session = Depends(get_db)):
    res = crud_rbac.delete_group(db, group_id)
    if not res: raise HTTPException(status_code=404, detail="Group not found")
    return {"status": "ok"}

@router.put("/users/{user_id}", response_model=schemas.UserOut, dependencies=[Depends(require_permission("system:all"))])
def update_full_user(user_id: int, user_update: schemas.UserUpdate, db: Session = Depends(get_db)):
    # 保护 admin
    target_user = crud_auth.get_user_by_id(db, user_id)
    if target_user and target_user.username == "admin" and user_update.username and user_update.username != "admin":
        raise HTTPException(status_code=403, detail="admin cannot be renamed")
    res = crud_auth.update_user(db, user_id, user_update)
    if not res: raise HTTPException(status_code=404, detail="User not found")
    return res
