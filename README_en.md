# OmniOps — Full-Stack Operations Management Platform

[English](./README_en.md) | [简体中文](./README.md)

> An operations console for unified management of LVS L4 Load Balancing, Nginx L7 Gateways, IP Assets, and Infrastructure.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)

---

## UI Preview

| Dashboard & Architecture | Core Assets & Infrastructure Components |
| :---: | :---: |
| <img src="./docs/assets/tab_dash.png" width="400"><br>System Dashboard | <img src="./docs/assets/tab_nginx_clusters.png" width="400"><br>L7 Gateway Clusters |
| <img src="./docs/assets/tab_topology.png" width="400"><br>Global Architecture Topology | <img src="./docs/assets/tab_servers.png" width="400"><br>Real Servers (RS) |
| <img src="./docs/assets/tab_infra.png" width="400"><br>Datacenter & Cabinet View | <img src="./docs/assets/tab_vips.png" width="400"><br>L4 VIP Schedulers |

<p align="center">
  <img src="./docs/assets/tab_ansible_console.png" width="850">
  <br><i>Ansible Unified Configuration Deployment & Operations Audit Terminal</i>
</p>

---

## Features

| Module | Description |
|------|------|
| **System Dashboard** | Real-time display of server nodes, L4 schedulers, L7 gateway clusters, and active routing summaries. |
| **LVS Schedulers** | Manage LVS Master/Backup nodes, VIP bindings, and Real Server weights. |
| **Nginx Clusters** | Manage Nginx clusters, Server Blocks, Upstreams, and Health Checks. |
| **IP Asset Pool** | Manage full IP assets based on types (Public EIP / VIP Reserved / Cabinet Interconnect) and locations. |
| **Infrastructure** | Visualized datacenter and cabinet topology, supporting Region → Datacenter → Cabinet 3-tier management. |
| **Config Deployment** | Generate and deploy Keepalived / Nginx configurations via Ansible, supporting Dry-run previews. |
| **RBAC Authorization** | Role-Based Access Control, supporting granular management of User Groups, Roles, and Permissions. |

---

## Architecture

```
OmniOps
├── frontend/          # Next.js 15 + TypeScript Frontend
│   ├── src/app/       # Main App Pages (SPA)
│   └── src/lib/       # i18n Internationalization (En/Zh)
└── backend/           # FastAPI + SQLite Backend
    ├── routers/       # Business Routing Modules
    ├── models.py      # ORM Data Models
    ├── schemas.py     # Pydantic Schemas
    └── templates/     # Ansible Jinja2 Configuration Templates
```

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # Default port 3010 (see next.config.ts)
```

Visit [http://localhost:3010](http://localhost:3010), default admin account: `admin / password123`

---

## Design Principles

- **Dark Mode First**: Deep-color themes tailored for extended operations use.
- **Bilingual Support**: Real-time switching between English and Chinese without page reloading.
- **Layered Permissions**: 4-tier roles from `SUPER_ADMIN` → `NETWORK_ADMIN` → `OPS` → `VIEWER`.
- **Security Audits**: Pre-deployment Dry-run previews, ensuring all changes are traceable.

---

## Roadmap

- [ ] System Baseline Management (Host Compliance Checks)
- [ ] System Service Deployment (systemd Orchestration)
- [ ] App Configuration Deployment (Multi-environment Config Center)
- [ ] Alerting Integration (Prometheus + AlertManager)

---

## 🛠 Developer Tools (Automated Documentation Update)

This system is equipped with an automated global view capture script based on Playwright. Upon completing UI iterations or adding new views, you don't need to take screenshots manually. Simply run the following command, and the script will **automatically and silently wake up a headless browser, log into the system, capture all dashboard views**, and output them directly to the documentation directory:

```bash
cd frontend
npm install -D playwright
node capture_all.mjs
```

---

## License

MIT © [jiuchan](https://github.com/jiuchan)
