from sqlalchemy.orm import Session
import models, schemas

# === NginxCluster CRUD ===

def get_nginx_clusters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.NginxCluster).offset(skip).limit(limit).all()

def create_nginx_cluster(db: Session, cluster: schemas.NginxClusterCreate):
    db_cluster = models.NginxCluster(
        name=cluster.name,
        nodes_ips=cluster.nodes_ips,
        ssh_user=cluster.ssh_user,
        infra_cabinet_id=cluster.infra_cabinet_id
    )
    db.add(db_cluster)
    db.commit()
    db.refresh(db_cluster)
    return db_cluster

def update_nginx_cluster(db: Session, cluster_id: int, cluster: schemas.NginxClusterCreate):
    db_cluster = db.query(models.NginxCluster).filter(models.NginxCluster.id == cluster_id).first()
    if db_cluster:
        db_cluster.name = cluster.name
        db_cluster.nodes_ips = cluster.nodes_ips
        db_cluster.ssh_user = cluster.ssh_user
        db_cluster.infra_cabinet_id = cluster.infra_cabinet_id
        db.commit()
        db.refresh(db_cluster)
    return db_cluster

def delete_nginx_cluster(db: Session, cluster_id: int):
    cluster = db.query(models.NginxCluster).filter(models.NginxCluster.id == cluster_id).first()
    if cluster:
        db.delete(cluster)
        db.commit()
    return cluster

# === NginxZone CRUD ===

def get_nginx_zones(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.NginxZone).offset(skip).limit(limit).all()

def create_nginx_zone(db: Session, zone: schemas.NginxZoneCreate):
    db_zone = models.NginxZone(
        domain=zone.domain,
        listen_port=zone.listen_port,
        ssl_enabled=zone.ssl_enabled,
        cluster_id=zone.cluster_id
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone

def update_nginx_zone(db: Session, zone_id: int, zone: schemas.NginxZoneCreate):
    db_zone = db.query(models.NginxZone).filter(models.NginxZone.id == zone_id).first()
    if db_zone:
        db_zone.domain = zone.domain
        db_zone.listen_port = zone.listen_port
        db_zone.ssl_enabled = zone.ssl_enabled
        db_zone.cluster_id = zone.cluster_id
        db.commit()
        db.refresh(db_zone)
    return db_zone

def delete_nginx_zone(db: Session, zone_id: int):
    db_zone = db.query(models.NginxZone).filter(models.NginxZone.id == zone_id).first()
    if db_zone:
        db.delete(db_zone)
        db.commit()
    return db_zone

# === NginxUpstream CRUD ===

def get_nginx_upstreams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.NginxUpstream).offset(skip).limit(limit).all()

def create_nginx_upstream(db: Session, upstream: schemas.NginxUpstreamCreate):
    db_upstream = models.NginxUpstream(
        ip_address=upstream.ip_address,
        port=upstream.port,
        weight=upstream.weight,
        zone_id=upstream.zone_id
    )
    db.add(db_upstream)
    db.commit()
    db.refresh(db_upstream)
    return db_upstream

def update_nginx_upstream(db: Session, upstream_id: int, upstream: schemas.NginxUpstreamCreate):
    db_upstream = db.query(models.NginxUpstream).filter(models.NginxUpstream.id == upstream_id).first()
    if db_upstream:
        db_upstream.ip_address = upstream.ip_address
        db_upstream.port = upstream.port
        db_upstream.weight = upstream.weight
        db_upstream.zone_id = upstream.zone_id
        db.commit()
        db.refresh(db_upstream)
    return db_upstream

def delete_nginx_upstream(db: Session, upstream_id: int):
    upstream = db.query(models.NginxUpstream).filter(models.NginxUpstream.id == upstream_id).first()
    if upstream:
        db.delete(upstream)
        db.commit()
    return upstream
