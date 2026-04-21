from database import SessionLocal
import models
db = SessionLocal()

vip = db.query(models.Vip).filter_by(id=1).first()
nodes = db.query(models.DatacenterNode).filter(models.DatacenterNode.id.in_([1,2])).all()

if vip and nodes:
    # 之前可能是通过 relationship 的 list append 
    for n in nodes:
        if n not in vip.datacenters:
            vip.datacenters.append(n)
    db.commit()
    print("Vip attaches Datacenters successfully manually.")
else:
    print("Not found VIP or Datacenters.")
    
db.close()
