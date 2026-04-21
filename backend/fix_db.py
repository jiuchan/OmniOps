from database import SessionLocal
from models import LvsVip, LvsDatacenter

db = SessionLocal()

vips = db.query(LvsVip).all()
nodes = db.query(LvsDatacenter).all()

for vip in vips:
    if not vip.datacenters and len(nodes) > 0:
        for n in nodes:
            if n.infra_cabinet_id == 1:
                # 检查之前是否已经挂载了确保唯一性
                if n not in vip.datacenters:
                    vip.datacenters.append(n)
        db.commit()
        print(f"Force attached VIP {vip.id} to nodes at cabinet 1.")

db.close()
