from sqlalchemy.orm import Session
from models import RBACPermission, RBACRole, RBACGroup, RBACUser
import schemas

# --- Permissions CRUD ---
def get_permissions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RBACPermission).offset(skip).limit(limit).all()

def create_permission(db: Session, perm: schemas.PermissionCreate):
    db_perm = RBACPermission(
        resource_name=perm.resource_name,
        description=perm.description
    )
    db.add(db_perm)
    db.commit()
    db.refresh(db_perm)
    return db_perm

# --- Roles CRUD ---
def get_roles(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RBACRole).offset(skip).limit(limit).all()

def create_role(db: Session, role: schemas.RoleCreate):
    db_role = RBACRole(
        code=role.code,
        name=role.name,
        description=role.description
    )
    
    if role.permissions:
        perms = db.query(RBACPermission).filter(RBACPermission.id.in_(role.permissions)).all()
        db_role.permissions.extend(perms)
        
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

# --- Groups CRUD ---
def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RBACGroup).offset(skip).limit(limit).all()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = RBACGroup(
        name=group.name,
        description=group.description
    )
    
    if group.roles:
        roles = db.query(RBACRole).filter(RBACRole.id.in_(group.roles)).all()
        db_group.roles.extend(roles)

    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

# --- User Matrix Builder ---
def get_user_permissions(db: Session, user_id: int) -> set:
    """计算出指定用户所拥有的全量有效权限字典（合并用户专属角色与通过各群组附赠的角色）"""
    db_user = db.query(RBACUser).filter(RBACUser.id == user_id).first()
    if not db_user:
        return set()

    # 当前用户所有的 roles (直接配的 + 组内带的)
    accumulated_roles = list(db_user.roles)
    for group in db_user.groups:
        accumulated_roles.extend(group.roles)
        
    # 对 roles 去重
    unique_roles = list({r.id: r for r in accumulated_roles}.values())
    
    # 获取所有的 permissions
    perms_set = set()
    for r in unique_roles:
        for p in r.permissions:
            perms_set.add(p.resource_name)
            
    legacy_role = db_user.role
    if legacy_role == "SUPER_ADMIN":
        perms_set.add("system:all")
        perms_set.add("lvs:write")
        perms_set.add("nginx:write")
        perms_set.add("eip:write")
    elif legacy_role == "NETWORK_ADMIN":
        perms_set.add("lvs:write")
        perms_set.add("nginx:write")
        perms_set.add("eip:write")
    elif legacy_role == "OPS" or legacy_role == "OPERATOR":
        perms_set.add("lvs:write")
        perms_set.add("nginx:write")
            
    return perms_set


# --- Added Updaters & Deleters ---

def update_group(db: Session, group_id: int, group: schemas.GroupCreate):
    db_group = db.query(RBACGroup).filter(RBACGroup.id == group_id).first()
    if not db_group: return None
    db_group.name = group.name
    db_group.description = group.description
    db_group.roles = db.query(RBACRole).filter(RBACRole.id.in_(group.roles)).all() if group.roles else []
    db.commit()
    db.refresh(db_group)
    return db_group

def delete_group(db: Session, group_id: int):
    db_group = db.query(RBACGroup).filter(RBACGroup.id == group_id).first()
    if db_group:
        db.delete(db_group)
        db.commit()
    return db_group

def update_role(db: Session, role_id: int, role: schemas.RoleCreate):
    db_role = db.query(RBACRole).filter(RBACRole.id == role_id).first()
    if not db_role: return None
    db_role.code = role.code
    db_role.name = role.name
    db_role.description = role.description
    db_role.permissions = db.query(RBACPermission).filter(RBACPermission.id.in_(role.permissions)).all() if role.permissions else []
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int):
    db_role = db.query(RBACRole).filter(RBACRole.id == role_id).first()
    if db_role:
        db.delete(db_role)
        db.commit()
    return db_role
