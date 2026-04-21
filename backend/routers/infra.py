from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas
from database import get_db

router = APIRouter(
    prefix="/api/infra",
    tags=["infra"],
    responses={404: {"description": "Not found"}},
)

@router.get("/topology", response_model=List[schemas.InfraDatacenterSchema])
def read_topology(db: Session = Depends(get_db)):
    """
    层级获取完整的基础设施拓扑结构（DataCenter -> Room -> Cabinet）
    由于 ORM 中声明了 relationship，Pydantic 的 from_attributes=True 会自动组装这个树
    """
    return crud.get_infra_topology(db)

@router.post("/datacenter", response_model=schemas.InfraDatacenterSchema)
def create_datacenter(item: schemas.InfraDatacenterCreate, db: Session = Depends(get_db)):
    return crud.create_infra_datacenter(db, item)

@router.put("/datacenter/{item_id}", response_model=schemas.InfraDatacenterSchema)
def update_datacenter(item_id: int, item: schemas.InfraDatacenterUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.InfraDatacenter).filter(models.InfraDatacenter.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="DataCenter not found")
    for k, v in item.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/datacenter/{item_id}")
def delete_datacenter(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.InfraDatacenter).filter(models.InfraDatacenter.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="DataCenter not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}

@router.post("/room", response_model=schemas.InfraRoomSchema)
def create_room(item: schemas.InfraRoomCreate, db: Session = Depends(get_db)):
    return crud.create_infra_room(db, item)

@router.put("/room/{item_id}", response_model=schemas.InfraRoomSchema)
def update_room(item_id: int, item: schemas.InfraRoomUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.InfraRoom).filter(models.InfraRoom.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Room not found")
    for k, v in item.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/room/{item_id}")
def delete_room(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.InfraRoom).filter(models.InfraRoom.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}

@router.post("/cabinet", response_model=schemas.InfraCabinetSchema)
def create_cabinet(item: schemas.InfraCabinetCreate, db: Session = Depends(get_db)):
    return crud.create_infra_cabinet(db, item)

@router.put("/cabinet/{item_id}", response_model=schemas.InfraCabinetSchema)
def update_cabinet(item_id: int, item: schemas.InfraCabinetUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.InfraCabinet).filter(models.InfraCabinet.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Cabinet not found")
    for k, v in item.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/cabinet/{item_id}")
def delete_cabinet(item_id: int, db: Session = Depends(get_db)):
    obj = db.query(models.InfraCabinet).filter(models.InfraCabinet.id == item_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Cabinet not found")
    db.delete(obj)
    db.commit()
    return {"ok": True}

