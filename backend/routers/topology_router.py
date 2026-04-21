from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models

router = APIRouter(
    prefix="/api/topology",
    tags=["topology"]
)

@router.get("/")
def get_topology(db: Session = Depends(get_db)):
    """一次性下发完全拼装成符合 ReactFlow 图元格式和引线规范的大拓扑图集"""
    try:
        datacenters = db.query(models.LvsDatacenter).all()
        vips = db.query(models.LvsVip).options(joinedload(models.LvsVip.datacenters)).all()
        servers = db.query(models.LvsServers).options(joinedload(models.LvsServers.vips)).all()
        
        nodes = []
        edges = []
        
        # 【层级 1】组点：实体机柜
        for i, dc in enumerate(datacenters):
            nodes.append({
                "id": f"dc-{dc.id}",
                "type": "datacenterNode",
                "position": {"x": 300 * i + 100, "y": 50},
                "data": {"label": dc.name, "wip": dc.wip, "state": dc.state}
            })
            
        # 【层级 2】组点与成线：虚拟 API 发散列
        for i, vip in enumerate(vips):
            vip_node_id = f"vip-{vip.id}"
            nodes.append({
                "id": vip_node_id,
                "type": "vipNode",
                "position": {"x": 300 * i + 50, "y": 250},
                "data": {"label": f"{vip.virtual_ipaddress}:{vip.port}", "app": vip.app, "algo": vip.lb_algo}
            })
            
            # 查找到属于那个虚拟 IP 上游的物理机柜实体执行捆绑 (Edge)
            for dc in vip.datacenters:
                edges.append({
                    "id": f"edge-dc{dc.id}-vip{vip.id}",
                    "source": f"dc-{dc.id}",
                    "target": vip_node_id,
                    "animated": True,
                    "style": {"stroke": "#10b981", "strokeWidth": 2}
                })
                
        # 【层级 3】底层资源池：Real Servers
        for i, srv in enumerate(servers):
            srv_node_id = f"srv-{srv.id}"
            nodes.append({
                "id": srv_node_id,
                "type": "serverNode",
                "position": {"x": 250 * i, "y": 450},
                "data": {"label": srv.servername, "ip": srv.serverip, "status": srv.onoff}
            })
            
            # 将真实服务器用橙黄色流线绑定至上面对应的虚拟 API
            for vip in srv.vips:
                edges.append({
                    "id": f"edge-vip{vip.id}-srv{srv.id}",
                    "source": f"vip-{vip.id}",
                    "target": srv_node_id,
                    "animated": True,
                    "style": {"stroke": "#f59e0b", "strokeWidth": 2}
                })
                
        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        import traceback
        with open("topology_500_error.log", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
