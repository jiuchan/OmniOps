from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas, crud
from routers.auth_router import require_permission

router = APIRouter(
    prefix="/api/servers",
    tags=["servers"]
)

@router.get("/", response_model=List[schemas.ServerSchema])
def read_servers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取全量物理服务器阵列资源池"""
    return crud.get_servers(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.ServerSchema, dependencies=[Depends(require_permission("lvs:write"))])
def create_server(server: schemas.ServerCreate, db: Session = Depends(get_db)):
    """在物理资源池中注入一台新后端机器"""
    return crud.create_server(db=db, server=server)

@router.put("/{server_id}", response_model=schemas.ServerSchema, dependencies=[Depends(require_permission("lvs:write"))])
def update_server_route(server_id: int, server: schemas.ServerCreate, db: Session = Depends(get_db)):
    """接管并覆写现存的物理实体机网卡元数据与状态"""
    updated = crud.update_server(db=db, server_id=server_id, server_data=server)
    if not updated:
        raise HTTPException(status_code=404, detail="Server not found for editing")
    return updated

@router.post("/{server_id}/attach/{vip_id}", dependencies=[Depends(require_permission("lvs:write"))])
def attach_server(server_id: int, vip_id: int, db: Session = Depends(get_db)):
    """关键路由：将真实计算节点映射到虚拟 VIP 集群中"""
    res = crud.attach_server_to_vip(db, vip_id, server_id)
    if not res:
        raise HTTPException(status_code=404, detail="VIP or Server not found")
    return {"message": f"Server {server_id} successfully mapped to VIP {vip_id}"}
