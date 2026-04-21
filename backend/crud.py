from sqlalchemy.orm import Session
import models, schemas

# ---- Datacenter CRUD ----
def get_datacenter(db: Session, datacenter_id: int):
    return db.query(models.LvsDatacenter).filter(models.LvsDatacenter.id == datacenter_id).first()

def get_datacenters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.LvsDatacenter).offset(skip).limit(limit).all()

def create_datacenter(db: Session, node: schemas.DatacenterCreate):
    db_node = models.LvsDatacenter(**node.dict())
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    return db_node

# ---- VIP CRUD ----
def get_vips(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.LvsVip).offset(skip).limit(limit).all()

def create_vip(db: Session, vip: schemas.VipCreate):
    db_vip = models.LvsVip(**vip.dict())
    db.add(db_vip)
    db.commit()
    db.refresh(db_vip)
    return db_vip

def update_vip(db: Session, vip_id: int, vip_data: schemas.VipCreate):
    db_vip = db.query(models.LvsVip).filter(models.LvsVip.id == vip_id).first()
    if db_vip:
        update_data = vip_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_vip, key, value)
        db.commit()
        db.refresh(db_vip)
    return db_vip

# ---- Servers CRUD ----
def get_servers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.LvsServers).offset(skip).limit(limit).all()

def create_server(db: Session, server: schemas.ServerCreate):
    db_server = models.LvsServers(**server.dict())
    db.add(db_server)
    db.commit()
    db.refresh(db_server)
    return db_server

def update_server(db: Session, server_id: int, server_data: schemas.ServerCreate):
    db_server = db.query(models.LvsServers).filter(models.LvsServers.id == server_id).first()
    if db_server:
        update_data = server_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_server, key, value)
        db.commit()
        db.refresh(db_server)
    return db_server

def attach_server_to_vip(db: Session, vip_id: int, server_id: int):
    # 利用关联表级联注入
    vip = db.query(models.LvsVip).filter(models.LvsVip.id == vip_id).first()
    server = db.query(models.LvsServers).filter(models.LvsServers.id == server_id).first()
    if vip and server:
        vip.servers.append(server)
        db.commit()
    return vip

# ---- Infra CRUD ----
def get_infra_topology(db: Session):
    return db.query(models.InfraDatacenter).all()

def create_infra_datacenter(db: Session, item: schemas.InfraDatacenterCreate):
    db_item = models.InfraDatacenter(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def create_infra_room(db: Session, item: schemas.InfraRoomCreate):
    db_item = models.InfraRoom(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def create_infra_cabinet(db: Session, item: schemas.InfraCabinetCreate):
    db_item = models.InfraCabinet(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def attach_vip_to_datacenter(db: Session, vip_id: int, datacenter_id: int):
    vip = db.query(models.LvsVip).filter(models.LvsVip.id == vip_id).first()
    dc = db.query(models.LvsDatacenter).filter(models.LvsDatacenter.id == datacenter_id).first()
    if vip and dc:
        vip.datacenters.append(dc)
        db.commit()
    return vip

# ---- EIP CRUD ----
def get_eips(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.LvsEip).offset(skip).limit(limit).all()

def create_eip(db: Session, eip: schemas.EipCreate):
    db_eip = models.LvsEip(**eip.dict())
    db.add(db_eip)
    db.commit()
    db.refresh(db_eip)
    return db_eip

def update_eip(db: Session, eip_id: int, eip_data: schemas.EipCreate):
    db_eip = db.query(models.LvsEip).filter(models.LvsEip.id == eip_id).first()
    if db_eip:
        update_data = eip_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_eip, key, value)
        db.commit()
        db.refresh(db_eip)
    return db_eip

def delete_eip(db: Session, eip_id: int):
    db_eip = db.query(models.LvsEip).filter(models.LvsEip.id == eip_id).first()
    if db_eip:
        db.delete(db_eip)
        db.commit()
    return db_eip

# ---- User 管理 CRUD ----
def get_user_by_username(db: Session, username: str):
    return db.query(models.RBACUser).filter(models.RBACUser.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.RBACUser).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    from auth_utils import get_password_hash
    db_user = models.RBACUser(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_role(db: Session, user_id: int, new_role: str):
    db_user = db.query(models.RBACUser).filter(models.RBACUser.id == user_id).first()
    if db_user:
        db_user.role = new_role
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.RBACUser).filter(models.RBACUser.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user
