# OmniOps LVS Control Center

一个专为 LVS + Nginx 高可用架构设计的可视化运维管理平台，支持四层负载均衡调度与七层应用网关的统一管控。

---

## 功能模块

### 🖥 系统总览 (Dashboard)
实时展示全局集群状态，包括：
- LVS 调度器存活数、VIP 数量、Nginx 集群规模
- 活跃路由条目统计
- 一键跳转到各核心操作

### 🌐 四层负载均衡 (L4 Load Balancing)
基于 Keepalived + IPVS 的四层 HA 调度管理：
- **调度器 (Director Schedulers)**：创建和管理 MASTER/BACKUP 主备节点对，支持绑定物理机柜位置
- **虚拟服务器 (VIPs)**：配置 VIP 入口，指定负载均衡算法（rr, wrr, lc 等）与转发模式（DR/NAT/TUN）
- **真实服务器 (Real Servers)**：挂载后端真实服务器节点，配置端口与权重

### 🔀 七层应用网关 (L7 Application Gateway)
基于 Nginx 的七层代理管理：
- **Nginx 集群 (Clusters)**：管理 Nginx 节点集群，支持公网 IP 绑定
- **虚拟主机 (Zones/VHosts)**：配置域名路由规则与 SSL 绑定
- **后端节点 (Upstreams)**：管理应用后端节点的权重与健康状态

### 📦 IP 资产池 (IP Asset Pool)
统一管理所有网络地址资源：
- **公网 IP (Public EIP)**：记录外部入口 IP 及其 ISP、带宽信息
- **VIP 预留段**：LVS 虚拟 IP 内部地址段管理
- **机柜互联网段 (Cabinet Subnets)**：机柜间物理互联地址段
- 支持按**资产类型**或**物理机房拓扑**两种维度切换视图

### 🏗 基础设施 (Infrastructure)
管理物理层级结构：
- **数据中心 (Datacenter)** → **机房 (Room)** → **机柜 (Cabinet)** 三层层级
- 所有网络资源（调度器、VIP、IP 资产）均可绑定到具体物理位置

### 🤖 自动化部署 (Automation)
基于 Ansible 的配置下发：
- 一键生成 `keepalived.conf` 并推送到目标调度器节点
- 支持按全局、数据中心、机柜组三种粒度下发
- 自动编译 Nginx VHost 配置并执行在线热重载

### 🔒 用户与权限 (RBAC)
基于角色的访问控制体系：
- 支持 `SUPER_ADMIN` / `NETWORK_ADMIN` / `OPS` / `VIEWER` 等系统角色
- 支持自定义角色与细粒度权限点分配
- 用户支持加入多个业务分组

---

## 技术架构

| 层级 | 技术栈 |
|------|--------|
| 前端 | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| 后端 | FastAPI (Python), SQLAlchemy, SQLite |
| 负载均衡 | LVS (IPVS + Keepalived) |
| 代理层 | Nginx |
| 自动化 | Ansible |

---

## 快速启动

### 后端

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| `admin` | `password123` | SUPER_ADMIN |

---

## 目录结构

```
lvs-control-center/
├── backend/              # FastAPI 后端
│   ├── main.py           # 应用入口
│   ├── models.py         # SQLAlchemy 数据模型
│   ├── schemas.py        # Pydantic 数据验证
│   ├── routers/          # 各模块 API 路由
│   └── templates/        # Keepalived/Nginx 配置模板
├── frontend/             # Next.js 前端
│   └── src/
│       ├── app/
│       │   └── page.tsx  # 主应用页面
│       └── lib/
│           └── i18n.tsx  # 国际化 (中/英)
└── lvsmng/               # LVS 配置管理脚本
```

---

## 主要设计原则

1. **物理拓扑强绑定**：所有网络资源（调度器 WIP/LIP、EIP 分配）都只能从同一物理机房下的资产中选择，防止跨机房误配
2. **多维资产视图**：IP 资产池支持按「资产类型」和「物理机房拓扑」两种视角查看，便于运维人员快速定位  
3. **批量操作支持**：EIP 批量录入支持动态添加多行映射规则，并发提交

---

## 许可证

内部使用，未对外开放。
