from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud_nginx, schemas, models
from database import get_db
import engine
from routers.auth_router import require_permission

router = APIRouter(prefix="/api/nginx", tags=["Nginx-SevenLayer"])

# === Clusters ===

@router.get("/clusters/", response_model=list[schemas.NginxClusterSchema])
def read_nginx_clusters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_nginx.get_nginx_clusters(db, skip=skip, limit=limit)

@router.post("/clusters/", response_model=schemas.NginxClusterSchema, dependencies=[Depends(require_permission("nginx:write"))])
def create_nginx_cluster(cluster: schemas.NginxClusterCreate, db: Session = Depends(get_db)):
    return crud_nginx.create_nginx_cluster(db=db, cluster=cluster)

@router.put("/clusters/{cluster_id}", response_model=schemas.NginxClusterSchema, dependencies=[Depends(require_permission("nginx:write"))])
def update_nginx_cluster(cluster_id: int, cluster: schemas.NginxClusterCreate, db: Session = Depends(get_db)):
    updated = crud_nginx.update_nginx_cluster(db=db, cluster_id=cluster_id, cluster=cluster)
    if not updated:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return updated

@router.delete("/clusters/{cluster_id}", dependencies=[Depends(require_permission("nginx:write"))])
def delete_nginx_cluster(cluster_id: int, db: Session = Depends(get_db)):
    cluster = crud_nginx.delete_nginx_cluster(db, cluster_id)
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return {"message": "Nginx cluster deleted successfully"}

# === Zones ===

@router.get("/zones/", response_model=list[schemas.NginxZoneSchema])
def read_nginx_zones(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_nginx.get_nginx_zones(db, skip=skip, limit=limit)

@router.post("/zones/", response_model=schemas.NginxZoneSchema, dependencies=[Depends(require_permission("nginx:write"))])
def create_nginx_zone(zone: schemas.NginxZoneCreate, db: Session = Depends(get_db)):
    return crud_nginx.create_nginx_zone(db=db, zone=zone)

@router.put("/zones/{zone_id}", response_model=schemas.NginxZoneSchema, dependencies=[Depends(require_permission("nginx:write"))])
def update_nginx_zone(zone_id: int, zone: schemas.NginxZoneCreate, db: Session = Depends(get_db)):
    updated = crud_nginx.update_nginx_zone(db=db, zone_id=zone_id, zone=zone)
    if not updated:
        raise HTTPException(status_code=404, detail="Zone not found")
    return updated

@router.delete("/zones/{zone_id}", dependencies=[Depends(require_permission("nginx:write"))])
def delete_nginx_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = crud_nginx.delete_nginx_zone(db, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"message": "Nginx zone deleted successfully"}

# === Upstreams ===

@router.get("/upstreams/", response_model=list[schemas.NginxUpstreamSchema])
def read_nginx_upstreams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_nginx.get_nginx_upstreams(db, skip=skip, limit=limit)

@router.post("/upstreams/", response_model=schemas.NginxUpstreamSchema, dependencies=[Depends(require_permission("nginx:write"))])
def create_nginx_upstream(upstream: schemas.NginxUpstreamCreate, db: Session = Depends(get_db)):
    return crud_nginx.create_nginx_upstream(db=db, upstream=upstream)

@router.put("/upstreams/{upstream_id}", response_model=schemas.NginxUpstreamSchema, dependencies=[Depends(require_permission("nginx:write"))])
def update_nginx_upstream(upstream_id: int, upstream: schemas.NginxUpstreamCreate, db: Session = Depends(get_db)):
    updated = crud_nginx.update_nginx_upstream(db=db, upstream_id=upstream_id, upstream=upstream)
    if not updated:
        raise HTTPException(status_code=404, detail="Upstream not found")
    return updated

@router.delete("/upstreams/{upstream_id}", dependencies=[Depends(require_permission("nginx:write"))])
def delete_nginx_upstream(upstream_id: int, db: Session = Depends(get_db)):
    us = crud_nginx.delete_nginx_upstream(db, upstream_id)
    if not us:
        raise HTTPException(status_code=404, detail="Upstream not found")
    return {"message": "Upstream deleted successfully"}

# === Build & Run Engine ===
# 预留给 Jinja2 & Ansible 调用的引擎接口
@router.post("/engine/apply/{zone_id}", dependencies=[Depends(require_permission("nginx:write"))])
def apply_zone_to_cluster(zone_id: int, db: Session = Depends(get_db)):
    db_zone = db.query(models.NginxZone).filter(models.NginxZone.id == zone_id).first()
    if not db_zone:
        raise HTTPException(status_code=404, detail="Zone missing on engine execution")
        
    db_cluster = db.query(models.NginxCluster).filter(models.NginxCluster.id == db_zone.cluster_id).first()
    if not db_cluster:
        raise HTTPException(status_code=400, detail="Zone has no attached cluster, cannot dispatch")
        
    upstreams = db.query(models.NginxUpstream).filter(models.NginxUpstream.zone_id == zone_id).all()
    
    # 抽取 Python 字典供引擎注水渲染
    zone_dict = {"id": db_zone.id, "domain": db_zone.domain, "listen_port": db_zone.listen_port, "ssl_enabled": db_zone.ssl_enabled}
    upstreams_list = [{"ip_address": u.ip_address, "port": u.port, "weight": u.weight} for u in upstreams]
    
    # 步骤 1： 渲染
    conf_string = engine.render_nginx_config(zone_info=zone_dict, upstreams=upstreams_list)
    
    # 步骤 2： 分发 (调度 Ansible Runner)
    result = engine.invoke_ansible_playbook(
       cluster_ips=db_cluster.nodes_ips,
       user=db_cluster.ssh_user,
       conf_content=conf_string,
       zone_domain=db_zone.domain
    )
    
    return result
