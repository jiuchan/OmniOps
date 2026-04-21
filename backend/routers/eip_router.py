from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, schemas
from database import get_db
from routers.auth_router import require_permission

router = APIRouter(
    prefix="/api/eips",
    tags=["eips"],
)

@router.get("/", response_model=List[schemas.EipSchema])
def read_eips(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    eips = crud.get_eips(db, skip=skip, limit=limit)
    return eips

@router.post("/", response_model=schemas.EipSchema, dependencies=[Depends(require_permission("eip:write"))])
def create_eip(eip: schemas.EipCreate, db: Session = Depends(get_db)):
    return crud.create_eip(db=db, eip=eip)

@router.put("/{eip_id}", response_model=schemas.EipSchema, dependencies=[Depends(require_permission("eip:write"))])
def update_eip(eip_id: int, eip: schemas.EipCreate, db: Session = Depends(get_db)):
    db_eip = crud.update_eip(db, eip_id=eip_id, eip_data=eip)
    if db_eip is None:
        raise HTTPException(status_code=404, detail="EIP not found")
    return db_eip

@router.delete("/{eip_id}", response_model=schemas.EipSchema, dependencies=[Depends(require_permission("eip:write"))])
def delete_eip(eip_id: int, db: Session = Depends(get_db)):
    db_eip = crud.delete_eip(db, eip_id=eip_id)
    if db_eip is None:
        raise HTTPException(status_code=404, detail="EIP not found")
    return db_eip
