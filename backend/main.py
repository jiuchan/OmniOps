from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models

# 此处执行数据库真实初始化挂载
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LVS Control Center API",
    description="Backend API for managing LVS cluster via web interface",
    version="1.0.0"
)

# 配置 CORS 允许前端应用访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3010", "http://127.0.0.1:3000", "http://127.0.0.1:3010"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 引入路由模块
from routers import datacenter_router, vip_router, server_router, topology_router, infra, eip_router, nginx_router, auth_router
app.include_router(auth_router.router)
app.include_router(datacenter_router.router)
app.include_router(vip_router.router)
app.include_router(server_router.router)
app.include_router(topology_router.router)
app.include_router(infra.router)
app.include_router(eip_router.router)
app.include_router(nginx_router.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "LVS Control Center"}
