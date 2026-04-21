from database import SessionLocal
from models import NginxCluster, NginxZone, NginxUpstream

db = SessionLocal()

# Check if already seeded
if not db.query(NginxCluster).first():
    cluster = NginxCluster(name="Ingress-Alpha", nodes_ips="10.0.1.201,10.0.1.202", ssh_user="deployer")
    db.add(cluster)
    db.commit()
    db.refresh(cluster)
    
    zone = NginxZone(domain="nexus.ai-demo.com", listen_port=80, ssl_enabled=0, cluster_id=cluster.id)
    db.add(zone)
    db.commit()
    db.refresh(zone)
    
    db.add(NginxUpstream(ip_address="192.168.50.11", port=3000, weight=100, zone_id=zone.id))
    db.add(NginxUpstream(ip_address="192.168.50.12", port=3000, weight=50, zone_id=zone.id))
    db.commit()
    
    print("Seeded Nginx L7 test data.")
else:
    print("L7 data already seeded.")
    
db.close()
