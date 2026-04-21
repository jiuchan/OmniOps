from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, crud
from routers.auth_router import require_permission

router = APIRouter(
    prefix="/api/vips",
    tags=["vips"]
)

@router.get("/", response_model=List[schemas.VipSchema])
def read_vips(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有VIP分组配置及其下的节点"""
    return crud.get_vips(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.VipSchema, dependencies=[Depends(require_permission("lvs:write"))])
def create_vip(vip: schemas.VipCreate, db: Session = Depends(get_db)):
    """下发并组建一个全新的VIP集群单元"""
    return crud.create_vip(db=db, vip=vip)

@router.put("/{vip_id}", response_model=schemas.VipSchema, dependencies=[Depends(require_permission("lvs:write"))])
def update_vip_route(vip_id: int, vip: schemas.VipCreate, db: Session = Depends(get_db)):
    """接管并覆写已存在的虚拟外网集群设定及暴露端口"""
    from fastapi import HTTPException
    updated = crud.update_vip(db=db, vip_id=vip_id, vip_data=vip)
    if not updated:
        raise HTTPException(status_code=404, detail="VIP not found for editing")
    return updated

@router.post("/{vip_id}/attach/{datacenter_id}", response_model=schemas.VipSchema, dependencies=[Depends(require_permission("lvs:write"))])
def attach_datacenter_to_vip(vip_id: int, datacenter_id: int, db: Session = Depends(get_db)):
    """将 VIP 流量接引挂载至指定的物理调度器节点上"""
    return crud.attach_vip_to_datacenter(db=db, vip_id=vip_id, datacenter_id=datacenter_id)
