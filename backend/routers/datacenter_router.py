from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
from jinja2 import Environment, FileSystemLoader

from database import get_db
import models, schemas, crud
from routers.auth_router import require_permission

router = APIRouter(
    prefix="/api/datacenter",
    tags=["datacenter"]
)

# Template 编译支撑引擎
TEMPLATE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "templates"))
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))

@router.get("/", response_model=List[schemas.DatacenterSchema])
def read_datacenters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有真实持久化的数据中心节点"""
    return crud.get_datacenters(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.DatacenterSchema, dependencies=[Depends(require_permission("lvs:write"))])
def create_datacenter(node: schemas.DatacenterCreate, db: Session = Depends(get_db)):
    """入库一个新的 LVS Keepalived 监听实例"""
    return crud.create_datacenter(db=db, node=node)

@router.post("/{datacenter_id}/deploy", dependencies=[Depends(require_permission("lvs:write"))])
def trigger_keepalived_deploy(datacenter_id: int, db: Session = Depends(get_db)):
    dc = crud.get_datacenter(db, datacenter_id)
    if not dc:
        raise HTTPException(status_code=404, detail="Datacenter Node Not Found")
        
    # 获取需要反向渲染进 LVS 的全部 VIP
    vips = crud.get_vips(db, skip=0, limit=100)
    
    try:
        template = jinja_env.get_template("keepalived.conf.j2")
        config_text = template.render(datacenter=dc, vips=vips)
        
        return {
            "status": "success",
            "message": "Configuration successfully rendered and staged for distribution.",
            "datacenter": dc.name,
            "raw_config": config_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
