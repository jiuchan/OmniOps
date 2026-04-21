"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Locale = 'zh' | 'en';

type Translations = {
  [key in Locale]: {
    [key: string]: string;
  };
};

const translations: Translations = {
  zh: {
    // System
    "sys.omni": "OmniOps 运维控制台",
    "sys.logout": "退出登录",
    "sys.disconnect": "断开连接",
    "sys.lang": "语言",

    // Navigation
    "nav.dash": "系统总览",
    "nav.assets": "资产目录",
    "nav.lvs_cluster": "四层负载均衡",
    "nav.l7_gateway": "七层应用网关",
    "nav.users": "用户与权限",
    "nav.infra": "基础设施",
    "nav.eips": "IP 资产池",
    "nav.schedule": "调度器",
    "nav.vips": "虚拟服务器",
    "nav.servers": "真实服务器",
    "nav.nginx_upstreams": "后端节点",
    "nav.ansible": "自动化部署",
    "nav.group_global": "全局控制",
    "nav.group_infra": "基础架构",
    "nav.group_auto": "自动化配置",
    "nav.group_security": "安全管理",
    "nav.topology": "网络拓扑",
    "nav.nginx_cluster": "Nginx 集群",
    "nav.nginx_zone": "虚拟主机",
    "nav.sec_manage": "审计与安全",
    "nav.roles": "角色与权限",

    // Dashboard
    "dash.main_title": "系统总览",
    "dash.main_desc": "统一管理 LVS 四层与 Nginx 七层流量调度",
    "dash.compute": "服务器节点",
    "dash.compute_desc": "物理服务器与容器节点",
    "dash.l4": "四层调度器",
    "dash.l4_desc": "主备节点 & VIP 入口",
    "dash.l7": "七层网关",
    "dash.l7_desc": "集群数 | {count} 个虚拟主机",
    "dash.routes": "活跃路由数",
    "dash.routes_desc": "LVS 转发规则 + 独立代理",
    "dash.telemetry": "实时并发连接监控",
    "dash.live": "实时监听中",
    "dash.command": "快速操作",
    "dash.lvs_ansible": "下发 LVS 配置",
    "dash.lvs_ansible_desc": "推送 Keepalived 主备配置",
    "dash.nginx_ansible": "下发 Nginx 配置",
    "dash.nginx_ansible_desc": "同步所有 Nginx 节点配置",
    "dash.audit": "资产全局审查",
    "dash.audit_desc": "查看总览页，检查是否存在孤立或心跳异常的集群节点",

    // Common Actions
    "common.delete_warning": "⚠️ 确认删除操作",
    "common.delete_desc": "您确定要删除此资源吗？\n\n🚨 此操作不可撤销，所有关联的流量路由将立即中断。",
    "common.abort": "取消",
    "common.execute_delete": "确认删除",
    "common.loading": "加载中...",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.add": "新增",
    "common.edit": "编辑",

    // LVS & Nginx specific
    "lvs.cluster_list": "LVS 集群列表",
    "nginx.cluster_add": "创建 Nginx 集群",
    "nginx.cluster_edit": "编辑 Nginx 集群",
    "nginx.zone_add": "创建虚拟主机 (Zone)",
    "nginx.zone_edit": "编辑虚拟主机 (Zone)",
    "assets.overview": "全局物理资产列表",

    // Topology & Assets
    "assets.title": "资产目录",
    "assets.desc": "展示所有地区、机房、机柜的层级结构与命名规范。",
    "assets.l1": "第一层：地区 (Region)",
    "assets.l1_code": "地区代号",
    "assets.l2": "第二层：机房 (Room)",
    "assets.l2_code": "机房代号",
    "assets.l3": "第三层：机柜 (Cabinet)",
    "assets.l3_code": "机柜代号",
    "assets.empty": "暂无物理资产记录，请先在「基础设施」面板中创建数据中心。",
    "topo.title": "网络拓扑视图",
    "topo.no_backend": "暂无后端服务器",
    "topo.no_probe": "该机柜下暂未部署 VIP",
    "lvs.director_title": "负载调度器 (Director Servers)",
    "lvs.director_wip": "公网 IP",
    "lvs.director_lip": "内网 IP",
    "lvs.no_lip_status": "内网 IP 未配置",
    "lvs.director_edit_btn": "✏️ 编辑节点",
    "lvs.director_matrix_btn": "编辑主备配置",
    "lvs.director_no_pair": "未找到主备节点对",
    "lvs.director_deploy_btn": "下发配置",
    "lvs.region": "[地区]",
    "lvs.room": "[机房]",
    "lvs.cabinet": "[机柜]",
    "lvs.empty_cab": "[空机柜] 未接入任何调度节点",
    "lvs.unassigned": "[未分配节点] (未绑定物理位置)",
    "lvs.no_auth_add": "[权限不足] 无法创建集群",
    "lvs.auth_add": "新建 LVS 集群",
    "devops.title": "Keepalived / ipvsadm 配置预览",
    "devops.status": "高可用配置已就绪，可通过自动化引擎推送到目标节点。",
    "common.confirm_close": "确认并关闭",

    // Infra
    "infra.title": "基础设施管理",
    "infra.subtitle": "数据中心 / 机房 / 机柜 层级视图",
    "infra.add_dc": "+ 新建数据中心",
    "infra.add_room": "+ 添加机房",
    "infra.add_rack": "+ 添加机柜",
    "infra.no_dc": "暂无数据中心记录",
    "infra.empty_rack": "空机柜",
    "infra.no_rack_deployed": "该机房下暂无机柜",
    "infra.no_room_alloc": "该数据中心下暂无机房",

    // VIPs
    "vips.title": "虚拟服务器 (VIP)",
    "vips.no_vips": "暂未创建任何虚拟服务器 (VIP)",
    "vips.unassigned_app": "未指定业务组",
    "vips.app_cluster": "[业务集群]",
    "vips.algo_mode": "调度算法: {algo} (模式: {mode})",
    "vips.mounted_gtw": "已绑定网关:",
    "vips.add": "创建虚拟服务器 (VIP)",
    "vips.no_auth": "[权限不足] 无法操作",

    // EIPs
    "eips.no_eips": "暂无 IP 资产记录",
    "eips.title": "IP 资产管理",
    "eips.desc": "管理公网 IP、内网 VIP 预留段及机柜互联网段的分配与绑定关系。",
    "eips.add": "添加 IP 资产",
    "eips.no_auth": "[权限不足] 无法访问",
    "eips.unassigned": "未使用",

    // Nginx
    "nc.title": "Nginx 代理集群",
    "nc.no_nodes": "暂未添加任何 Nginx 集群节点",
    "nc.inner_ip": "内网 IP:",
    "nc.eip_expose": "🌐 已绑定公网 IP",
    "nc.private_mode": "🌐 内网访问模式",
    "nc.add": "创建 Nginx 集群",
    "nz.title": "虚拟主机 (Nginx VHost Zones)",
    "nz.no_zones": "暂未创建任何虚拟主机路由",
    "nz.refresh_edge": "重载配置",
    "nz.eip_expose": "🔗 公网 IP 入口",
    "nz.no_eip": "未配置公网 IP",
    "nz.upstreams": "后端节点 (Upstreams)",
    "nz.nodes": "{count} 个节点",
    "nz.wait_backend": "等待绑定后端节点...",
    "nz.add": "创建虚拟主机",
    "nu.title": "后端应用节点 (Upstreams)",
    "nu.no_upstreams": "暂未添加任何后端应用节点",
    "nu.weight": "权重 (Weight)",
    "nu.attached_zone": "所属虚拟主机:",
    "nu.add": "添加后端节点",

    // RS
    "rs.title": "真实服务器 (Real Servers)",
    "rs.no_servers": "暂未添加任何真实服务器",
    "rs.listen_port": "监听端口:",
    "rs.pool": "[节点组]",
    "rs.mapped_vip": "绑定 VIP:",
    "rs.add": "添加真实服务器",

    // Ansible
    "ansi.title": "自动化部署控制台",
    "ansi.lvs_title": "下发 LVS 负载均衡配置",
    "ansi.lvs_desc": "编译并推送 Keepalived 主备高可用配置、VIP 以及 LVS 转发规则。",
    "ansi.scope_global": "🎯 全局下发 (所有节点)",
    "ansi.scope_dc": "🏙 按数据中心下发",
    "ansi.scope_pod": "🗄 按机柜组下发",
    "ansi.eval_btn": "预览配置",
    "ansi.nginx_title": "下发 Nginx 代理配置",
    "ansi.nginx_desc": "将控制台中的 VHost 和 Upstream 配置同步到所有 Nginx 节点，并执行配置重载。",

    // RBAC
    "rbac.title": "用户与权限管理",
    "rbac.users": "👤 用户管理",
    "rbac.groups": "🏢 业务分组",
    "rbac.roles": "🎭 角色与权限",
    "rbac.add_user": "新增用户",
    "rbac.archived": "已停用 (ARCHIVED)",
    "rbac.no_groups": "未加入任何分组或角色",
    "rbac.no_group_data": "暂无分组数据",
    "rbac.add_group": "新建分组",
    "rbac.no_roles": "暂无角色，请新建",
    "rbac.no_perms": "空角色 (无任何权限)",
    "rbac.add_role": "新建角色",
    "rbac.expand_perms": "展开查看所有可分配权限",
    "rbac.no_system_perms": "系统尚未定义任何权限点",
    "rbac.viewer": "[默认] VIEWER",
    "rbac.related_roles": "关联角色:",
    "rbac.archive_role": "停用此角色",

    // Modals & Misc
    "sys.current_view": "当前视图",
    "modal.group_edit": "编辑分组配置",
    "modal.group_add": "新建分组",
    "modal.eip_edit": "编辑 IP 资产",
    "modal.eip_add": "添加 IP 资产",
    "modal.vip_edit": "编辑虚拟服务器 (VIP)",
    "modal.vip_add": "创建虚拟服务器 (VIP)",
    "modal.nginx_del_title": "确认删除",
    "modal.nginx_del_msg1": "您确定要删除此资源吗？",
    "modal.nginx_del_msg2": "此操作不可撤销，所有通过该路由转发的流量将立即中断。",
    "modal.nginx_cluster_edit": "编辑 Nginx 集群",
    "modal.nginx_cluster_add": "创建 Nginx 集群",
    "modal.nginx_zone_edit": "编辑虚拟主机 (Zone)",
    "modal.nginx_zone_add": "创建虚拟主机 (Zone/VHost)",
    "modal.nginx_upstream_edit": "编辑后端节点",
    "modal.nginx_upstream_add": "添加后端节点",
    "modal.rs_edit": "编辑真实服务器 (RS)",
    "modal.rs_add": "添加真实服务器 (RS)",
    "modal.confirm_title": "操作确认",

    // Forms
    "form.group_name": "分组名称",
    "form.description": "说明",
    "form.bind_roles": "关联角色",
    "form.role_name": "角色名称",
    "form.role_code": "角色代码",
    "form.bind_perms": "授予权限",
    "form.username": "用户名",
    "form.password": "密码",
    "form.sys_role": "系统角色",

    "form.infra_region": "地区名称",
    "form.infra_region_code": "地区代号",
    "form.infra_auto_completion": "（将根据名称自动生成）",
    "form.infra_room": "机房名称",
    "form.infra_room_code": "机房代号",
    "form.infra_cab": "机柜编号",
    "form.infra_cab_loc": "机柜位置坐标",
    "form.infra_cab_code": "机柜代号",
    "form.node_name": "节点名称",
    "form.node_wip": "公网 IP",
    "form.node_lip": "内网 IP",
    "form.node_vrid": "VRRP 虚拟路由 ID",
    "form.node_rid": "全局路由 ID",
    "form.node_cab": "绑定机柜位置",
  },
  en: {
    // System
    "sys.omni": "OmniOps Console",
    "sys.logout": "Sign Out",
    "sys.disconnect": "Disconnect",
    "sys.lang": "Language",

    // Navigation
    "nav.dash": "Dashboard",
    "nav.assets": "Asset Directory",
    "nav.lvs_cluster": "L4 Load Balancing",
    "nav.l7_gateway": "L7 Application Gateway",
    "nav.users": "Users & Permissions",
    "nav.infra": "Infrastructure",
    "nav.eips": "IP Asset Pool",
    "nav.schedule": "Schedulers",
    "nav.vips": "Virtual Servers",
    "nav.servers": "Real Servers",
    "nav.nginx_upstreams": "Backend Nodes",
    "nav.ansible": "Automation",
    "nav.group_global": "GLOBAL CONTROL",
    "nav.group_infra": "INFRASTRUCTURE",
    "nav.group_auto": "AUTOMATION",
    "nav.group_security": "SECURITY",
    "nav.topology": "Network Topology",
    "nav.nginx_cluster": "Nginx Clusters",
    "nav.nginx_zone": "Virtual Hosts",
    "nav.sec_manage": "Audit & Security",
    "nav.roles": "Roles & Permissions",

    // Dashboard
    "dash.main_title": "System Overview",
    "dash.main_desc": "Unified management of LVS L4 and Nginx L7 traffic routing",
    "dash.compute": "Server Nodes",
    "dash.compute_desc": "Physical servers and container nodes",
    "dash.l4": "L4 Directors",
    "dash.l4_desc": "Active/Backup directors & VIP endpoints",
    "dash.l7": "L7 Gateways",
    "dash.l7_desc": "Clusters | {count} Virtual Hosts",
    "dash.routes": "Active Routes",
    "dash.routes_desc": "LVS rules + standalone proxies",
    "dash.telemetry": "Live Connection Monitor",
    "dash.live": "Live",
    "dash.command": "Quick Actions",
    "dash.lvs_ansible": "Deploy LVS Config",
    "dash.lvs_ansible_desc": "Push Keepalived active/backup config",
    "dash.nginx_ansible": "Deploy Nginx Config",
    "dash.nginx_ansible_desc": "Sync all Nginx node configurations",
    "dash.audit": "Global Asset Audit",
    "dash.audit_desc": "Review the asset list to identify orphaned or unreachable cluster nodes",

    // Common Actions
    "common.delete_warning": "⚠️ Confirm Deletion",
    "common.delete_desc": "Are you sure you want to delete this resource?\n\n🚨 This action is irreversible. All associated traffic routes will be immediately interrupted.",
    "common.abort": "Cancel",
    "common.execute_delete": "Confirm Delete",
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.add": "Add",
    "common.edit": "Edit",

    // LVS & Nginx specific
    "lvs.cluster_list": "LVS Cluster List",
    "nginx.cluster_add": "Create Nginx Cluster",
    "nginx.cluster_edit": "Edit Nginx Cluster",
    "nginx.zone_add": "Create Virtual Host (Zone)",
    "nginx.zone_edit": "Edit Virtual Host (Zone)",
    "assets.overview": "Global Physical Asset List",

    // Topology & Assets
    "assets.title": "Asset Directory",
    "assets.desc": "Hierarchical view of all regions, rooms, and cabinets with their naming conventions.",
    "assets.l1": "Level 1: Region",
    "assets.l1_code": "Region Code",
    "assets.l2": "Level 2: Room",
    "assets.l2_code": "Room Code",
    "assets.l3": "Level 3: Cabinet",
    "assets.l3_code": "Cabinet Code",
    "assets.empty": "No physical assets found. Please create a datacenter in the Infrastructure panel first.",
    "topo.title": "Network Topology View",
    "topo.no_backend": "No backend servers attached",
    "topo.no_probe": "No VIPs deployed in this cabinet",
    "lvs.director_title": "Load Balancer Nodes (Directors)",
    "lvs.director_wip": "Public IP",
    "lvs.director_lip": "Private IP",
    "lvs.no_lip_status": "LAN IP not configured",
    "lvs.director_edit_btn": "✏️ Edit Node",
    "lvs.director_matrix_btn": "Edit HA Pair",
    "lvs.director_no_pair": "Active/Backup pair not found",
    "lvs.director_deploy_btn": "Deploy Config",
    "lvs.region": "[Region]",
    "lvs.room": "[Room]",
    "lvs.cabinet": "[Cabinet]",
    "lvs.empty_cab": "[Empty Cabinet] No director nodes attached",
    "lvs.unassigned": "[Unassigned Nodes] (No physical location bound)",
    "lvs.no_auth_add": "[Insufficient Permission] Cannot create cluster",
    "lvs.auth_add": "Create New LVS Cluster",
    "devops.title": "Keepalived / ipvsadm Config Preview",
    "devops.status": "HA configuration is ready to be pushed to target nodes via automation.",
    "common.confirm_close": "Confirm & Close",

    // Infra
    "infra.title": "Infrastructure Management",
    "infra.subtitle": "Datacenter / Room / Cabinet Hierarchy",
    "infra.add_dc": "+ New Datacenter",
    "infra.add_room": "+ Add Room",
    "infra.add_rack": "+ Add Cabinet",
    "infra.no_dc": "No datacenters found",
    "infra.empty_rack": "Empty cabinet",
    "infra.no_rack_deployed": "No cabinets in this room",
    "infra.no_room_alloc": "No rooms in this datacenter",

    // VIPs
    "vips.title": "Virtual Servers (VIPs)",
    "vips.no_vips": "No virtual servers created yet",
    "vips.unassigned_app": "No Business Group",
    "vips.app_cluster": "[App Cluster]",
    "vips.algo_mode": "LB Algo: {algo} (Mode: {mode})",
    "vips.mounted_gtw": "Attached Gateways:",
    "vips.add": "Create Virtual Server (VIP)",
    "vips.no_auth": "[Insufficient Permission]",

    // EIPs
    "eips.no_eips": "No IP assets registered",
    "eips.title": "IP Asset Management",
    "eips.desc": "Manage public IPs, internal VIP reserved blocks, and cabinet interconnect subnets.",
    "eips.add": "Add IP Asset",
    "eips.no_auth": "[Insufficient Permission]",
    "eips.unassigned": "Unassigned",
    "eips.in_use": "[IN USE] Mapped to gateway",

    // Nginx
    "nc.title": "Nginx Proxy Clusters",
    "nc.no_nodes": "No Nginx cluster nodes added yet",
    "nc.inner_ip": "Internal IP:",
    "nc.eip_expose": "🌐 Public IP Bound",
    "nc.private_mode": "🌐 Internal Access Mode",
    "nc.add": "Create Nginx Cluster",
    "nz.title": "Virtual Hosts (Nginx VHost Zones)",
    "nz.no_zones": "No virtual host routes created yet",
    "nz.refresh_edge": "Reload Config",
    "nz.eip_expose": "🔗 Public IP Endpoint",
    "nz.no_eip": "No public IP configured",
    "nz.upstreams": "Backend Nodes (Upstreams)",
    "nz.nodes": "{count} nodes",
    "nz.wait_backend": "Waiting for backend nodes...",
    "nz.add": "Create Virtual Host",
    "nu.title": "Backend Application Nodes (Upstreams)",
    "nu.no_upstreams": "No backend application nodes added yet",
    "nu.weight": "Weight",
    "nu.attached_zone": "Attached Virtual Host:",
    "nu.add": "Add Backend Node",

    // RS
    "rs.title": "Real Servers",
    "rs.no_servers": "No real servers added yet",
    "rs.listen_port": "Listening Port:",
    "rs.pool": "[Node Pool]",
    "rs.mapped_vip": "Bound VIP:",
    "rs.add": "Add Real Server",

    // Ansible
    "ansi.title": "Automation Console",
    "ansi.lvs_title": "Deploy LVS Load Balancing Config",
    "ansi.lvs_desc": "Compile and push Keepalived active/backup HA config, VIP assignments, and LVS forwarding rules.",
    "ansi.scope_global": "🎯 Global (All Nodes)",
    "ansi.scope_dc": "🏙 By Datacenter",
    "ansi.scope_pod": "🗄 By Cabinet Group",
    "ansi.eval_btn": "Preview Config",
    "ansi.nginx_title": "Deploy Nginx Proxy Config",
    "ansi.nginx_desc": "Sync all VHost zones and upstream backends to Nginx nodes and reload the configuration.",

    // RBAC
    "rbac.title": "User & Permission Management",
    "rbac.users": "👤 Users",
    "rbac.groups": "🏢 Groups",
    "rbac.roles": "🎭 Roles & Permissions",
    "rbac.add_user": "Add User",
    "rbac.archived": "Disabled (ARCHIVED)",
    "rbac.no_groups": "No groups or roles assigned",
    "rbac.no_group_data": "No group data",
    "rbac.add_group": "Create Group",
    "rbac.no_roles": "No roles found. Please create one.",
    "rbac.no_perms": "Empty role (no permissions)",
    "rbac.add_role": "Create Role",
    "rbac.expand_perms": "Show all assignable permissions",
    "rbac.no_system_perms": "No permissions defined in the system",
    "rbac.viewer": "[Default] VIEWER",
    "rbac.related_roles": "Related Roles:",
    "rbac.archive_role": "Disable This Role",

    // Modals & Misc
    "sys.current_view": "Current View",
    "modal.group_edit": "Edit Group",
    "modal.group_add": "Create Group",
    "modal.eip_edit": "Edit IP Asset",
    "modal.eip_add": "Add IP Asset",
    "modal.vip_edit": "Edit Virtual Server (VIP)",
    "modal.vip_add": "Create Virtual Server (VIP)",
    "modal.nginx_del_title": "Confirm Deletion",
    "modal.nginx_del_msg1": "Are you sure you want to delete this resource?",
    "modal.nginx_del_msg2": "This action cannot be undone. All traffic routed through this path will be immediately interrupted.",
    "modal.nginx_cluster_edit": "Edit Nginx Cluster",
    "modal.nginx_cluster_add": "Create Nginx Cluster",
    "modal.nginx_zone_edit": "Edit Virtual Host (Zone)",
    "modal.nginx_zone_add": "Create Virtual Host (Zone/VHost)",
    "modal.nginx_upstream_edit": "Edit Backend Node",
    "modal.nginx_upstream_add": "Add Backend Node",
    "modal.rs_edit": "Edit Real Server (RS)",
    "modal.rs_add": "Add Real Server (RS)",
    "modal.confirm_title": "Action Confirmation",

    // Forms
    "form.group_name": "Group Name",
    "form.description": "Description",
    "form.bind_roles": "Assign Roles",
    "form.role_name": "Role Name",
    "form.role_code": "Role Code",
    "form.bind_perms": "Grant Permissions",
    "form.username": "Username",
    "form.password": "Password",
    "form.sys_role": "System Role",

    "form.infra_region": "Region Name",
    "form.infra_region_code": "Region Code",
    "form.infra_auto_completion": "(auto-generated from name)",
    "form.infra_room": "Room Name",
    "form.infra_room_code": "Room Code",
    "form.infra_cab": "Cabinet Number",
    "form.infra_cab_loc": "Cabinet Location (e.g. Zone-C-01)",
    "form.infra_cab_code": "Cabinet Code",
    "form.node_name": "Node Name",
    "form.node_wip": "Public IP",
    "form.node_lip": "Private IP",
    "form.node_vrid": "VRRP Virtual Router ID",
    "form.node_rid": "Global Router ID",
    "form.node_cab": "Bind to Cabinet",
  }
};

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('zh');

  const t = (key: string, variables?: Record<string, string | number>): string => {
    let str = translations[locale][key] || translations['zh'][key] || key;
    if (variables) {
      Object.keys(variables).forEach((k) => {
        str = str.replace(`{${k}}`, String(variables[k]));
      });
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a I18nProvider');
  }
  return context;
}
