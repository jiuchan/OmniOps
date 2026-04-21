"use client";

import { useEffect, useState } from "react";
import { Copy, Terminal, Server, Activity, ShieldAlert, Cpu, X, Plus, Globe, Layers, HardDrive, Link, Database, Unplug, Building, Settings, AlertTriangle, Network, Archive, List, Hash, Trash2, LayoutDashboard, LogOut, MapPin, Cloud, ChevronLeft, ChevronRight , Calculator } from "lucide-react";
import NetworkGraph from "./NetworkGraph";

// --- [ IP Subnet Helper ] ---
const ip2long = (ip: string) => ip.split('.').reduce((acc, val) => (acc << 8) + parseInt(val, 10), 0) >>> 0;
const long2ip = (long: number) => [long >>> 24, (long >> 16) & 255, (long >> 8) & 255, long & 255].join('.');

type SmartComboboxProps = {
  value: string;
  onChange: (e: { target: { value: string } } | React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
  disabled?: boolean;
  theme?: "cyan" | "amber";
  placeholder?: string;
};

const SmartCombobox = ({ value, onChange, options, disabled, theme = "cyan", placeholder = "" }: SmartComboboxProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const colors = theme === "cyan" 
      ? { border: "border-cyan-900/50 focus:border-cyan-500", text: "text-cyan-400", icon: "text-cyan-500", hover: "hover:bg-cyan-900/40" }
      : { border: "border-neutral-800 focus:border-amber-500", text: "text-amber-400", icon: "text-amber-500", hover: "hover:bg-amber-900/40" };
    
    const filteredOptions = value ? options.filter((o: string) => o.includes(value)) : options;

    return (
      <div className="relative w-full">
         <input 
            type="text"
            disabled={disabled}
            value={value}
            onChange={(e) => { onChange(e); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            className={`w-full bg-black border rounded p-3 pr-10 outline-none font-mono text-sm ${disabled ? 'border-neutral-800 text-neutral-600 cursor-not-allowed' : `${colors.border} ${colors.text}`}`}
            placeholder={placeholder}
         />
         {!disabled && (
             <div 
               className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer ${colors.icon}`}
               onMouseDown={(e) => { 
                   e.preventDefault(); 
                   // 强制 input 获取焦点，并切换展开状态
                   e.currentTarget.parentElement?.querySelector('input')?.focus();
                   setIsOpen(!isOpen); 
               }}
             >
               ▼
             </div>
         )}
         
         {isOpen && !disabled && filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-black border border-neutral-700/80 rounded shadow-2xl max-h-48 overflow-y-auto mix-blend-normal">
               {filteredOptions.map((opt: string) => (
                  <div 
                    key={opt} 
                    className={`p-2 px-3 font-mono text-sm cursor-pointer border-b border-neutral-800/50 last:border-0 ${colors.text} ${colors.hover} transition-colors`}
                    onMouseDown={(e) => { e.preventDefault(); onChange({ target: { value: opt }}); setIsOpen(false); }}
                  >
                    {opt} <span className="ml-2 text-[10px] opacity-30 tracking-widest">{theme === "cyan" ? "AVAILABLE" : "FREE NODE"}</span>
                  </div>
               ))}
            </div>
         )}
      </div>
    );
};

const getAvailableHostIps = (networks: any[], usedIps: string[], limit=60) => {
    let results: string[] = [];
    for (const net of networks) {
        if (!net.ip_address) continue;
        
        try {
            let start: number, end: number;
            
            if (net.ip_address.includes('-')) {
                // 兼容区间格式 (e.g. 192.168.1.100-192.168.1.150)
                const [startStr, endStr] = net.ip_address.split('-');
                start = ip2long(startStr.trim());
                end = ip2long(endStr.trim());
            } else {
                // 标准 CIDR 格式
                const [ipStr, prefixStr] = net.ip_address.split('/');
                const prefix = parseInt(prefixStr || "32", 10);
                if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;
                
                const ipLong = ip2long(ipStr.trim());
                const maskLong = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
                const networkLong = (ipLong & maskLong) >>> 0;
                const broadcastLong = (networkLong | (~maskLong)) >>> 0;
                
                start = prefix >= 31 ? networkLong : networkLong + 1;
                end = prefix >= 31 ? broadcastLong : broadcastLong - 1;
            }

            for (let i = start; i <= end; i++) {
                const hostIp = long2ip(i);
                if (!usedIps.includes(hostIp)) {
                    results.push(hostIp);
                    if (results.length >= limit) return results;
                }
            }
        } catch (e) {}
    }
    return results;
};

// --- [ Pinyin Helper for Datacenter Infra Codes ] ---
const getFirstLetter = (char: string) => {
    if (/[a-zA-Z0-9]/.test(char)) return char.toUpperCase();
    const letters = 'ABCDEFGHJKLMNOPQRSTWXYZ'.split('');
    const zh = "阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀".split('');
    if (!/[\u4e00-\u9fa5]/.test(char)) return char.toUpperCase(); // 非汉字直接大写
    if (char.localeCompare('阿', 'zh-CN') < 0) return ''; // 越界不可识别汉字
    if (char.localeCompare('帀', 'zh-CN') >= 0) return 'Z';
    for (let i = 0; i < zh.length; i++) {
        if (char.localeCompare(zh[i], 'zh-CN') < 0) return letters[i - 1] || 'A';
    }
    return 'Z';
};

const getCodeForName = (str: string) => {
    if (!str) return "";
    return str.split('').map(c => getFirstLetter(c)).join('').replace(/[^A-Z0-9]/g, '');
};
// ---------------------------------------------------


interface DatacenterNode {
  id: number;
  name: string;
  zoneCode: string;
  rackCode: string;
  publicIp: string;
  privateIp?: string;
  haRole: string;
  vrrpGroupId?: number;
  routerId?: string;
  vrrpRouterId?: number;
  priority?: number;
  infraCabinetId?: number | null;
  datacenter?: string;
  cabinet?: string;
  wip?: string;
  lip?: string;
  state?: string;
  gid?: number;
  router_id?: string;
  virtual_router_id?: number;
  infra_cabinet_id?: number | null;
}

interface ServerNode {
  id: number;
  serverName: string;
  serverIp: string;
  serverPrivateIp: string;
  port: number;
  weight: number;
  status: string;
  vips: any[];
  name?: string;
  datacenter?: string;
  cabinet?: string;
  servername?: string;
  serverip?: string;
  serverlip?: string;
  onoff?: string;
}

interface InfraCabinet {
  id: number;
  name: string;
  code?: string;
}

interface InfraRoom {
  id: number;
  name: string;
  code?: string;
  cabinets?: InfraCabinet[];
}

interface InfraDatacenter {
  id: number;
  name: string;
  code?: string;
  datacenter?: string;
  rooms?: InfraRoom[];
}

interface EipEntry {
  id?: number;
  ip_address: string;
  asset_type?: string;
  bandwidth?: number;
  isp?: string;
  state?: string;
  vip_id?: number | null;
  target_internal_ip?: string;
  infra_room_id?: number | null;
  infra_cabinet_id?: number | null;
  [key: string]: unknown;
}

interface VipNode {
  id: number;
  port: number;
  vipAddress: string;
  serviceName?: string;
  healthCheckInterval?: number;
  lbAlgorithm?: string;
  forwardingMode?: string;
  datacenters?: DatacenterNode[];
  eips?: EipEntry[];
  virtual_ipaddress?: string;
  vip_address?: string;
  app?: string;
  service_name?: string;
  delay_loop?: number;
  health_check_interval?: number;
  lb_algo?: string;
  lb_algorithm?: string;
  lb_kind?: string;
  forwarding_mode?: string;
  wan_ip?: string;
  [key: string]: unknown;
}

interface NginxUpstreamNode {
  id: number;
  ip_address: string;
  port: number;
  weight: number;
  zone_id?: number | null;
  attached_zone_domain?: string;
}

interface NginxZoneNode {
  id: number;
  domain: string;
  listen_port: number;
  ssl_enabled: number | boolean;
  cluster_id?: number | null;
  upstreams?: NginxUpstreamNode[];
  eips?: EipEntry[];
}

interface NginxClusterNode {
  id: number;
  name: string;
  nodes_ips: string;
  ssh_user?: string;
  infra_cabinet_id?: number | null;
  eips?: EipEntry[];
}

import { useTranslation, Locale } from '../lib/i18n';

export default function Home() {
  const { t, locale, setLocale } = useTranslation();
  const [activeTab, setActiveTab] = useState("dash"); useEffect(() => { const handleHash = () => { if(window.location.hash) setActiveTab(window.location.hash.substring(1)); }; window.addEventListener("hashchange", handleHash); handleHash(); return () => window.removeEventListener("hashchange", handleHash); }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 各分组独立折叠状态
  const [isInfraSectionOpen, setIsInfraSectionOpen] = useState(true);
  const [isLvsSectionOpen, setIsLvsSectionOpen] = useState(true);
  const [isNginxSectionOpen, setIsNginxSectionOpen] = useState(true);
  const [isAutomationSectionOpen, setIsAutomationSectionOpen] = useState(true);
  const [isSecuritySectionOpen, setIsSecuritySectionOpen] = useState(true);
  const [pulseData, setPulseData] = useState<number[]>([10, 25, 40, 20, 60, 45, 80, 55, 30, 40, 70, 50, 85, 30, 65]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- RBAC 授权防线 ---
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{username: string, role: string} | null>(null);
  const [loginUsername, setLoginUsername] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("password123");
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoginError("");
     try {
         const response = await fetch("http://localhost:8000/api/auth/token", {
             method: "POST",
             headers: {"Content-Type": "application/x-www-form-urlencoded"},
             body: new URLSearchParams({
                username: loginUsername,
                password: loginPassword
             })
         });
         if (!response.ok) {
             setLoginError("用户名或密码错误。");
             return;
         }
         const data = await response.json();
         setAuthToken(data.access_token);
         
         // 换取角色令牌信息
         const userRes = await fetch("http://localhost:8000/api/auth/me", {
             headers: { "Authorization": `Bearer ${data.access_token}` }
         });
         const userData = await userRes.json();
         setCurrentUser(userData);
         loadData();
     } catch (err) {
         setLoginError("认证服务暂时不可用，请稍后重试。");
     }
  };

  const logout = () => {
     setAuthToken(null);
     setCurrentUser(null);
  };
  
  // Datacenters 态
  const [nodes, setNodes] = useState<DatacenterNode[]>([]);
  
  // 物理基建模型态
  const [infraData, setInfraData] = useState<InfraDatacenter[]>([]);
  
  // VIP 态
  const [vips, setVips] = useState<VipNode[]>([]);

  // Servers 态
  const [servers, setServers] = useState<ServerNode[]>([]);
  
  // Nginx 7-Layer 态
  const [nginxZones, setNginxZones] = useState<NginxZoneNode[]>([]);
  const [nginxClusters, setNginxClusters] = useState<NginxClusterNode[]>([]);
  const [nginxUpstreams, setNginxUpstreams] = useState<NginxUpstreamNode[]>([]);

  // Clusters
  const [isNginxClusterModalOpen, setIsNginxClusterModalOpen] = useState(false);
  const [editingNginxClusterId, setEditingNginxClusterId] = useState<number | null>(null);
  const [nginxClusterFormData, setNginxClusterFormData] = useState({
     name: "APP-Nginx-Cluster",
     nodes_ips: "192.168.1.100,192.168.1.101",
     ssh_user: "root",
     infra_cabinet_id: null as number | null
  });

  // Zones
  const [isNginxZoneModalOpen, setIsNginxZoneModalOpen] = useState(false);
  const [editingNginxZoneId, setEditingNginxZoneId] = useState<number | null>(null);
  const [nginxFormData, setNginxFormData] = useState({
     domain: "api.example.com",
     listen_port: 80,
     ssl_enabled: 0,
     cluster_id: null as number | null
  });

  // Upstreams
  const [isNginxUpstreamModalOpen, setIsNginxUpstreamModalOpen] = useState(false);
  const [editingNginxUpstreamId, setEditingNginxUpstreamId] = useState<number | null>(null);
  const [nginxUpstreamFormData, setNginxUpstreamFormData] = useState({
     ip_address: "10.0.0.10",
     port: 8080,
     weight: 10,
     zone_id: null as number | null
  });
  // Ansible Terminal 态
  const [ansibleLogs, setAnsibleLogs] = useState<string[]>([]);
  const [isAnsibleModalOpen, setIsAnsibleModalOpen] = useState(false);
  
  // Ansible Deployment Auth Control
  const [deployAuthModal, setDeployAuthModal] = useState<{isOpen: boolean, type: string, scope: string}>({isOpen: false, type: "", scope: "global"});
  const [deployAuthInput, setDeployAuthInput] = useState("");
  const [lvsDeployScope, setLvsDeployScope] = useState("global");
  const [nginxDeployScope, setNginxDeployScope] = useState("global");

  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [editingServerId, setEditingServerId] = useState<number | null>(null);
  const [serverFormData, setServerFormData] = useState({ targetCabinetId: null as number | null,
    serverName: "APP-Node",
    serverIp: "192.168.1.50",
    serverPrivateIp: "10.0.0.50",
    port: 6443,
    weight: 100,
    status: "ON",
    targetVipId: null as number | null
  });

  const openServerModal = (server?: ServerNode) => {
    const firstCabId = infraData[0]?.rooms?.[0]?.cabinets?.[0]?.id || null;
    if (server) {
      setEditingServerId(server.id);
      setServerFormData({
         targetCabinetId: firstCabId,
         serverName: server.serverName || server.servername || "",
         serverIp: server.serverIp || server.serverip || "",
         serverPrivateIp: server.serverPrivateIp || server.serverlip || "",
         port: server.port,
         weight: server.weight,
         status: server.status || server.onoff || "ON",
         targetVipId: server.vips && server.vips.length > 0 ? server.vips[0].id : null
      });
    } else {
      setEditingServerId(null);
      setServerFormData({
        targetCabinetId: firstCabId,
        serverName: "APP-Node",
        serverIp: "192.168.1.50",
        serverPrivateIp: "10.0.0.50",
        port: 6443,
        weight: 100,
        status: "ON",
        targetVipId: null
      });
    }
    setIsServerModalOpen(true);
  };

  // 模态框及表单控件态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoDeploy, setAutoDeploy] = useState(false);
  const [editingGroupIds, setEditingGroupIds] = useState<{masterId: number, backupId: number} | null>(null);
  const [editingSingleNode, setEditingSingleNode] = useState<DatacenterNode | null>(null);
  const [singleNodeFormData, setSingleNodeFormData] = useState({
    name: "", datacenter: "", cabinet: "", wip: "", lip: "", infra_cabinet_id: null as number | null
  });

  const [formData, setFormData] = useState({
    master_name: "LVS-Node-Master",
    backup_name: "LVS-Node-Backup",
    datacenter: "CN-BJ1-R02-01",
    cabinet: "R02-C01",
    infra_cabinet_id: null as number | null,
    gid: 2001,
    wip_master: "10.0.0.101",
    lip_master: "192.168.1.101",
    wip_backup: "10.0.0.102",
    lip_backup: "192.168.1.102",
    router_id: "LVS_DR",
    virtual_router_id: 52
  });

  const [editingVipId, setEditingVipId] = useState<number | null>(null);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [vipFormData, setVipFormData] = useState({
    vipAddress: "192.168.1.235",
    port: 6443,
    serviceName: "TCP-Ingress-Gateway",
    healthCheckInterval: 6,
    lbAlgorithm: "wlc",
    forwardingMode: "DR",
    targetCabinetId: null as number | null,
    wanIpsInput: ""
  });

  const openVipModal = (vip?: VipNode) => {
     const firstCabId = infraData[0]?.rooms?.[0]?.cabinets?.[0]?.id || null;

     if (vip) {
        setEditingVipId(vip.id);
        setVipFormData({
            vipAddress: vip.virtual_ipaddress || vip.vip_address || vip.vipAddress || "",
            wanIpsInput: vip.wan_ip || "",
            port: vip.port,
            serviceName: vip.app || vip.service_name || vip.serviceName || "",
            healthCheckInterval: vip.delay_loop || vip.health_check_interval || vip.healthCheckInterval || 6,
            lbAlgorithm: vip.lb_algo || vip.lb_algorithm || vip.lbAlgorithm || "wlc",
            forwardingMode: vip.lb_kind || vip.forwarding_mode || vip.forwardingMode || "DR",
            targetCabinetId: vip.datacenters?.[0]?.infra_cabinet_id ?? null
        });
     } else {
        setEditingVipId(null);
        setVipFormData({
            vipAddress: "192.168.1.235",
            wanIpsInput: "",
            port: 6443,
            serviceName: "TCP-Ingress-Gateway",
            healthCheckInterval: 6,
            lbAlgorithm: "wlc",
            forwardingMode: "DR",
            targetCabinetId: firstCabId
         });
     }
     setIsVipModalOpen(true);
  };

  // EIP 公网资源控制态
  const [eips, setEips] = useState<EipEntry[]>([]);
  const [isEipModalOpen, setIsEipModalOpen] = useState(false);
  const [editingEipId, setEditingEipId] = useState<number | null>(null);
  const [eipFormData, setEipFormData] = useState({
    asset_type: "PUBLIC_EIP",
    bandwidth: 100,
    isp: "BGP",
    infra_room_id: null as number | null,
    infra_cabinet_id: null as number | null
  });

  const [eipEntries, setEipEntries] = useState([{ ip_address: "", target_internal_ip: "" }]);
  const [eipViewDimension, setEipViewDimension] = useState<"TYPE" | "LOCATION">("TYPE");

  const resolveInfraPath = (eip: EipEntry) => {
      let path = "";
      for (const dc of infraData) {
          const matchedRoom = dc.rooms?.find((r) => r.id === eip.infra_room_id);
          if (matchedRoom) {
              path = `[${dc.name}] ➔ ${matchedRoom.name}`;
              if (eip.infra_cabinet_id) {
                  const matchedCab = matchedRoom.cabinets?.find((c) => c.id === eip.infra_cabinet_id);
                  if (matchedCab) path += ` ➔ 机柜 ${matchedCab.name}`;
              }
              break;
          }
      }
      return path;
  };

  const renderEipCard = (eip: EipEntry) => {
      const infraPath = resolveInfraPath(eip);
      return (
        <div key={`eip-${eip.id}`} className="bg-neutral-900 border border-sky-500/20 rounded-xl p-5 hover:border-sky-500/50 transition-colors group flex flex-col">
           <div className="flex justify-between items-start mb-3">
              <span className="text-xl font-bold font-mono text-sky-400 tracking-wider break-all">{eip.ip_address}</span>
              <button onClick={() => openEipModal(eip)} className="text-neutral-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"><Settings className="w-4 h-4"/></button>
           </div>
           <div className="flex flex-wrap items-center gap-2 mb-4">
              {(!eip.asset_type || eip.asset_type === 'PUBLIC_EIP') ? (
                  <>
                    <span className="px-2 py-0.5 bg-blue-900/40 border border-blue-500/30 text-[10px] text-blue-300 rounded uppercase font-bold">公网接入</span>
                    <span className="px-2 py-0.5 bg-neutral-800 text-[10px] text-neutral-300 rounded uppercase font-bold">{eip.isp || "BGP"}</span>
                    <span className="px-2 py-0.5 bg-neutral-800 text-[10px] text-neutral-300 rounded font-bold">{eip.bandwidth || 100} Mbps</span>
                  </>
              ) : eip.asset_type === 'VIP_RESERVED' ? (
                  <span className="px-2 py-0.5 bg-purple-900/40 border border-purple-500/30 text-[10px] text-purple-300 rounded uppercase font-bold">VIP预留网段 </span>
              ) : (
                  <span className="px-2 py-0.5 bg-emerald-900/40 border border-emerald-500/30 text-[10px] text-emerald-300 rounded uppercase font-bold">机柜互联 Subnet</span>
              )}
           </div>
           <div className="pt-3 border-t border-neutral-800/60 mt-auto">
              {(eip.vip_id || eip.target_internal_ip) ? (
                <div className="flex items-center justify-between text-xs text-emerald-400 font-mono">
                   <span className="flex items-center gap-1" title="映射与绑定路线"><Link className="w-3 h-3" /> {(!eip.asset_type || eip.asset_type === 'PUBLIC_EIP') ? "外网映射" : "内网占用"}</span>
                   <span className="truncate ml-2" title={`路由指向: ${eip.target_internal_ip}`}>
                      {eip.vip_id ? `VIP: ${vips.find((v) => v.id === eip.vip_id)?.vipAddress || eip.vip_id}` : `DR: ${eip.target_internal_ip}`}
                   </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-neutral-500 font-mono italic">
                   <span>{t('eips.unassigned')}</span>
                   <div className="flex gap-1 flex-col items-end">
                       {infraPath ? <span className="text-[10px] truncate text-emerald-500/80 font-sans not-italic font-bold" title={infraPath}><MapPin className="w-2.5 h-2.5 inline mr-0.5 mb-0.5" />{infraPath}</span> : <span className="text-[10px] truncate text-neutral-600/70">全局浮动资产 (无物理挂载)</span>}
                   </div>
                </div>
              )}
           </div>
        </div>
      );
  };

  const openEipModal = (eip?: any) => {
    if (eip) {
       setEditingEipId(eip.id);
       setEipEntries([{ ip_address: eip.ip_address, target_internal_ip: eip.target_internal_ip || "" }]);
       setEipFormData({
         bandwidth: eip.bandwidth,
         isp: eip.isp,
         asset_type: eip.asset_type || "PUBLIC_EIP",
         infra_room_id: eip.infra_room_id,
         infra_cabinet_id: eip.infra_cabinet_id
       });
    } else {
       setEditingEipId(null);
       setEipEntries([{ ip_address: "", target_internal_ip: "" }]);
       setEipFormData({
         bandwidth: 100,
         isp: "BGP",
         asset_type: "PUBLIC_EIP",
         infra_room_id: null,
         infra_cabinet_id: null
       });
    }
    setIsEipModalOpen(true);
  };

  // DevOps 挂载配置
  const [deployLog, setDeployLog] = useState<{dc: string, config: string} | null>(null);
  const [deployingId, setDeployingId] = useState<number | null>(null);

  // 基础建设模型态
  const [isInfraModalOpen, setIsInfraModalOpen] = useState(false);
  const [infraModalType, setInfraModalType] = useState<"datacenter" | "room" | "cabinet" | "full_chain">("datacenter");
  const [infraFormData, setInfraFormData] = useState({
    name: "", code: "", parent_id: 0,
    room_name: "", room_code: "",
    cabinets: [{ name: "", code: "" }]
  });

  // --- RBAC User Management ---
  const [rbacUsers, setRbacUsers] = useState<any[]>([]);
  const [rbacGroups, setRbacGroups] = useState<any[]>([]);
  const [rbacRoles, setRbacRoles] = useState<any[]>([]);
  const [rbacPermissions, setRbacPermissions] = useState<any[]>([]);
  const [rbacSubTab, setRbacSubTab] = useState<"users" | "groups" | "roles">("users");

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [customConfirm, setCustomConfirm] = useState({ isOpen: false, message: "", onConfirm: async () => {} });
  const [userFormData, setUserFormData] = useState({ id: 0, username: "", password: "", role: "VIEWER", groups: [] as number[] });

  const fetchUsers = async () => {
     if (currentUser?.role !== 'SUPER_ADMIN') return;
     try {
       const res = await fetch("http://localhost:8000/api/auth/users", {
          headers: { "Authorization": `Bearer ${authToken}` }
       });
       if (res.ok) {
          const data = await res.json();
          setRbacUsers(Array.isArray(data) ? data : []);
       }
       
       const [gRes, rRes, pRes] = await Promise.all([
          fetch("http://localhost:8000/api/auth/groups", { headers: { "Authorization": `Bearer ${authToken}` } }),
          fetch("http://localhost:8000/api/auth/roles", { headers: { "Authorization": `Bearer ${authToken}` } }),
          fetch("http://localhost:8000/api/auth/permissions", { headers: { "Authorization": `Bearer ${authToken}` } })
       ]);
       if (gRes.ok) setRbacGroups(await gRes.json());
       if (rRes.ok) setRbacRoles(await rRes.json());
       if (pRes.ok) setRbacPermissions(await pRes.json());
       
     } catch (err) {
       console.error("Failed fetching users or dicts", err);
     }
  };

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ id: 0, name: "", description: "", roles: [] as number[] });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ id: 0, name: "", code: "", description: "", permissions: [] as number[] });

  // --- [ 全局互斥占用黑名单计算 ] ---
  // 该黑名单通过 vips / servers 生成全局排他网段，以杜绝调度系统内网IP互相重压
  const globalUsedPrivateIps = [...vips.map((v) => v.vipAddress), ...servers.map((s) => s.serverIp), ...servers.map((s) => s.serverPrivateIp)].filter(Boolean) as string[];
  const globalUsedPublicIps = [...servers.map((s) => s.serverIp || s.serverip)].filter(Boolean) as string[];


  const handleAddGroup = async (e: React.FormEvent) => {
     e.preventDefault();
     setSubmitting(true);
     try {
       const url = groupFormData.id ? `http://localhost:8000/api/auth/groups/${groupFormData.id}` : "http://localhost:8000/api/auth/groups";
       const method = groupFormData.id ? "PUT" : "POST";
       await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
          body: JSON.stringify(groupFormData)
       });
       setIsGroupModalOpen(false);
       setGroupFormData({ id: 0, name: "", description: "", roles: [] });
       fetchUsers();
     } catch (err) {
       console.error("Failed adding/updating group", err);
     } finally {
       setSubmitting(false);
     }
  };

  const handleArchiveGroup = async (g: any) => {
     setCustomConfirm({
       isOpen: true,
       message: "确定要归档该群组？\n\n归档后该群组将不再用于权限分配。",
       onConfirm: async () => {
         try {
           await fetch(`http://localhost:8000/api/auth/groups/${g.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
              body: JSON.stringify({ name: g.name.startsWith("[ARCHIVED]") ? g.name : "[ARCHIVED] " + g.name, description: "该群组已归档，不再参与权限分配。", roles: [] })
           });
           fetchUsers();
         } catch(err) {}
       }
     });
  };

  const handleAddRole = async (e: React.FormEvent) => {
     e.preventDefault();
     setSubmitting(true);
     try {
       const url = roleFormData.id ? `http://localhost:8000/api/auth/roles/${roleFormData.id}` : "http://localhost:8000/api/auth/roles";
       const method = roleFormData.id ? "PUT" : "POST";
       await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
          body: JSON.stringify(roleFormData)
       });
       setIsRoleModalOpen(false);
       setRoleFormData({ id: 0, name: "", code: "", description: "", permissions: [] });
       fetchUsers(); 
     } catch (err) {
       console.error("Failed adding/updating role", err);
     } finally {
       setSubmitting(false);
     }
  };

  const handleArchiveRole = async (r: any) => {
     setCustomConfirm({
       isOpen: true,
       message: "确定要归档该角色？\n\n归档后，所有关联用户和群组将失去该角色授予的权限。",
       onConfirm: async () => {
         try {
           await fetch(`http://localhost:8000/api/auth/roles/${r.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
              body: JSON.stringify({ name: r.name.startsWith("[ARCHIVED]") ? r.name : "[ARCHIVED] " + r.name, code: r.code + "_ARCHIVED_" + Date.now().toString().slice(-4), description: "该角色已归档，不再参与权限分配。", permissions: [] })
           });
           fetchUsers();
         } catch(err) {}
       }
     });
  };

  const handleAddUser = async (e: React.FormEvent) => {
     e.preventDefault();
     setSubmitting(true);
     try {
       const url = userFormData.id ? `http://localhost:8000/api/auth/users/${userFormData.id}` : "http://localhost:8000/api/auth/users";
       const method = userFormData.id ? "PUT" : "POST";
       // password如果不传就置成空，但是如果是新建必须有password，我们这里简化如果是PUT且password没填则不传
       const payload: any = { ...userFormData };
       if(userFormData.id && !userFormData.password) delete payload.password;
       
       await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
          body: JSON.stringify(payload)
       });
       setIsUserModalOpen(false);
       fetchUsers();
     } catch (err) {
       console.error("Failed adding/updating user", err);
     } finally {
       setSubmitting(false);
     }
  };

  const handleDeleteUser = async (user_id: number) => {
     setCustomConfirm({
       isOpen: true,
       message: "确定要归档该账户？\n\n归档后该账户将无法登录，可在后台恢复。",
       onConfirm: async () => {
         try {
           await fetch(`http://localhost:8000/api/auth/users/${user_id}/role`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
              body: JSON.stringify({ role: "ARCHIVED" })
           });
           fetchUsers();
         } catch(err) {}
       }
     });
  };

  const handleUpdateRole = async (user_id: number, new_role: string) => {
    try {
      await fetch(`http://localhost:8000/api/auth/users/${user_id}/role?role=${new_role}`, {
         method: "PUT",
         headers: { "Authorization": `Bearer ${authToken}` }
      });
      fetchUsers();
    } catch(err) {
      console.error("Failed to update user role");
    }
  };

  useEffect(() => {
     if (activeTab === 'rbac_users') {
        fetchUsers();
     }
     if (activeTab === 'dash') {
         const tm = setInterval(() => {
             setPulseData(prev => {
                const arr = [...prev.slice(1), Math.floor(Math.random() * 80) + 10];
                return arr;
             });
         }, 1200);
         return () => clearInterval(tm);
     }
  }, [activeTab]);

  const loadData = () => {
    setLoading(true);
    // 拉取物理节点
    fetch("http://localhost:8000/api/datacenter/")
      .then((res) => res.json())
      .then((data) => {
        const normalizedNodes = (data || []).map((node: any) => ({
          ...node,
          zoneCode: node.datacenter ?? node.zone_code,
          rackCode: node.cabinet ?? node.rack_code,
          publicIp: node.wip ?? node.public_ip,
          privateIp: node.lip ?? node.private_ip,
          haRole: node.state ?? node.ha_role,
          vrrpGroupId: node.gid ?? node.vrrp_group_id,
          routerId: node.router_id,
          vrrpRouterId: node.virtual_router_id,
          infraCabinetId: node.infra_cabinet_id,
        }));
        setNodes(normalizedNodes);
      })
      .catch((err) => console.error(err));
      
    // 同步拉取虚拟网关组
    fetch("http://localhost:8000/api/vips/")
      .then((res) => res.json())
      .then((data) => {
        const normalizedVips = (data || []).map((vip: any) => ({
          ...vip,
          vipAddress: vip.virtual_ipaddress ?? vip.vip_address,
          serviceName: vip.app ?? vip.service_name,
          healthCheckInterval: vip.delay_loop ?? vip.health_check_interval,
          lbAlgorithm: vip.lb_algo ?? vip.lb_algorithm,
          forwardingMode: vip.lb_kind ?? vip.forwarding_mode,
        }));
        // IP 智能递增排序
        const sortedVips = normalizedVips.sort((a: any, b: any) => (a.vipAddress || "").localeCompare((b.vipAddress || ""), undefined, { numeric: true }));
        setVips(sortedVips);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    // 同步拉取物理资源机
    fetch("http://localhost:8000/api/servers/")
      .then((res) => res.json())
      .then((data) => {
        const normalizedServers = (data || []).map((server: any) => ({
          ...server,
          serverName: server.servername ?? server.server_name,
          serverIp: server.serverip ?? server.server_ip,
          serverPrivateIp: server.serverlip ?? server.server_private_ip,
          status: server.onoff ?? server.enabled_state,
        }));
        // IP 智能递增排序
        const sortedServers = normalizedServers.sort((a: any, b: any) => (a.serverIp || "").localeCompare((b.serverIp || ""), undefined, { numeric: true }));
        setServers(sortedServers);
      })
      .catch((err) => console.error(err));

    // 同步拉取基础设施大树
    fetch("http://localhost:8000/api/infra/topology")
      .then((res) => res.json())
      .then((data) => setInfraData(data))
      .catch((err) => console.error(err));

    // 同步拉取公网弹性 IP
    fetch("http://localhost:8000/api/eips/")
      .then((res) => res.json())
      .then((data) => setEips(data))
      .catch((err) => console.error(err));

    // 同步拉取 Nginx 七层资源
    fetch("http://localhost:8000/api/nginx/zones/")
      .then((res) => res.json())
      .then((data) => setNginxZones(data))
      .catch((err) => console.error(err));
      
    fetch("http://localhost:8000/api/nginx/clusters/")
      .then((res) => res.json())
      .then((data) => setNginxClusters(data))
      .catch((err) => console.error(err));
      
    fetch("http://localhost:8000/api/nginx/upstreams/")
      .then((res) => res.json())
      .then((data) => setNginxUpstreams(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const masterPayload = {
        name: formData.master_name,
        datacenter: formData.datacenter,
        cabinet: formData.cabinet,
        infra_cabinet_id: formData.infra_cabinet_id,
        gid: formData.gid,
        wip: formData.wip_master,
        lip: formData.lip_master,
        state: "MASTER",
        router_id: formData.router_id + "_1",
        virtual_router_id: formData.virtual_router_id,
        priority: 100
      };
      
      const backupPayload = {
        name: formData.backup_name,
        datacenter: formData.datacenter,
        cabinet: formData.cabinet,
        infra_cabinet_id: formData.infra_cabinet_id,
        gid: formData.gid,
        wip: formData.wip_backup,
        lip: formData.lip_backup,
        state: "BACKUP",
        router_id: formData.router_id + "_2",
        virtual_router_id: formData.virtual_router_id,
        priority: 90
      };

      const isPut = editingGroupIds !== null;
      const urlMaster = isPut ? `http://localhost:8000/api/datacenter/${editingGroupIds.masterId}/` : "http://localhost:8000/api/datacenter/";
      const urlBackup = isPut ? `http://localhost:8000/api/datacenter/${editingGroupIds.backupId}/` : "http://localhost:8000/api/datacenter/";

      const resMaster = await fetch(urlMaster, {
        method: isPut ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(masterPayload)
      });
      const dataMaster = resMaster.ok ? await resMaster.json() : null;
      
      const resBackup = await fetch(urlBackup, {
        method: isPut ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(backupPayload)
      });
      const dataBackup = resBackup.ok ? await resBackup.json() : null;

      if (resMaster.ok && resBackup.ok) {
        if (autoDeploy) {
           if (dataMaster?.id) await handleDeploy({id: dataMaster.id, name: dataMaster.name} as any);
           if (dataBackup?.id) await handleDeploy({id: dataBackup.id, name: dataBackup.name} as any);
        }
        setIsModalOpen(false);
        setEditingGroupIds(null);
        loadData();
      } else {
        const errMaster = !resMaster.ok ? await resMaster.text() : "";
        const errBackup = !resBackup.ok ? await resBackup.text() : "";
        console.error("Failed saving pairs:", errMaster, errBackup);
      }
    } catch (err) {
      console.error("Failed to insert node", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSingleNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSingleNode) return;
    setSubmitting(true);
    try {
      const payload = {
        name: singleNodeFormData.name,
        datacenter: singleNodeFormData.datacenter,
        cabinet: singleNodeFormData.cabinet,
        infra_cabinet_id: singleNodeFormData.infra_cabinet_id,
        wip: singleNodeFormData.wip,
        lip: singleNodeFormData.lip
      };
      // PATCH allows partial updates without affecting state/router_id/etc.
      const res = await fetch(`http://localhost:8000/api/datacenter/${editingSingleNode.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingSingleNode(null);
        loadData();
      }
    } catch (err) {
      console.error("Failed to patch single node", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInfraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (infraModalType === "full_chain") {
      try {
        const dcResp = await fetch("http://localhost:8000/api/infra/datacenter", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: infraFormData.name, code: infraFormData.code })
        });
        if (!dcResp.ok) throw new Error("园区节点建设失败");
        const dcData = await dcResp.json();

        const roomResp = await fetch("http://localhost:8000/api/infra/room", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: infraFormData.room_name, code: infraFormData.room_code, datacenter_id: dcData.id })
        });
        if (!roomResp.ok) throw new Error("内部机房开辟失败");
        const roomData = await roomResp.json();

        for (const cab of infraFormData.cabinets) {
           if (!cab.name || !cab.code) continue;
           const cabResp = await fetch("http://localhost:8000/api/infra/cabinet", {
               method: "POST", headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ name: cab.name, code: cab.code, room_id: roomData.id })
           });
           if (!cabResp.ok) throw new Error(`机架 ${cab.name} 构建失败`);
        }

        setIsInfraModalOpen(false);
        loadData();
      } catch (err: any) {
      } finally {
        setSubmitting(false);
      }
      return;
    }


    if (infraModalType === "cabinet") {
      try {
        const authHeader = { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` };
        for (const cab of infraFormData.cabinets) {
           if (!cab.name || !cab.code) continue;
           const cabResp = await fetch("http://localhost:8000/api/infra/cabinet", {
               method: "POST", headers: authHeader,
               body: JSON.stringify({ name: cab.name, code: cab.code, room_id: infraFormData.parent_id })
           });
           if (!cabResp.ok) {
             const err = await cabResp.json().catch(() => ({}));
             console.error("机柜阵列构建失败", err);
           }
        }
        setIsInfraModalOpen(false);
        loadData();
      } catch (err: any) {
        alert("多机柜创建失败: " + (err.message || err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    let endpoint = "";
    const payload: any = { name: infraFormData.name, code: infraFormData.code };

    if (infraModalType === "datacenter") {
      endpoint = "/api/infra/datacenter";
    } else if (infraModalType === "room") {
      endpoint = "/api/infra/room";
      payload.datacenter_id = infraFormData.parent_id;

    }

    try {
      const resp = await fetch("http://localhost:8000" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        setIsInfraModalOpen(false);
        loadData();
      } else {
        const errorData = await resp.json();
        alert("操作失败: " + JSON.stringify(errorData));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openNginxClusterModal = (cluster?: NginxClusterNode) => {
    const firstCabId = infraData[0]?.rooms?.[0]?.cabinets?.[0]?.id || null;
    if (cluster) {
      setEditingNginxClusterId(cluster.id);
      setNginxClusterFormData({ name: cluster.name, nodes_ips: cluster.nodes_ips, ssh_user: cluster.ssh_user || 'root', infra_cabinet_id: cluster.infra_cabinet_id || firstCabId });
    } else {
      setEditingNginxClusterId(null);
      setNginxClusterFormData({ name: "", nodes_ips: "", ssh_user: "root", infra_cabinet_id: firstCabId });
    }
    setIsNginxClusterModalOpen(true);
  };

  const handleNginxClusterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = editingNginxClusterId !== null;
      const url = isEdit 
        ? `http://localhost:8000/api/nginx/clusters/${editingNginxClusterId}` 
        : "http://localhost:8000/api/nginx/clusters/";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(nginxClusterFormData)
      });
      if (res.ok) {
        setIsNginxClusterModalOpen(false);
        loadData();
      } else {
        alert("保存 Nginx 集群失败");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openNginxZoneModal = (zone?: NginxZoneNode) => {
    if (zone) {
      setEditingNginxZoneId(zone.id);
      setNginxFormData({ domain: zone.domain, listen_port: zone.listen_port, ssl_enabled: zone.ssl_enabled ? 1 : 0, cluster_id: zone.cluster_id ?? null });
    } else {
      setEditingNginxZoneId(null);
      setNginxFormData({ domain: "", listen_port: 80, ssl_enabled: 0, cluster_id: null });
    }
    setIsNginxZoneModalOpen(true);
  };

  const handleNginxZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = editingNginxZoneId !== null;
      const url = isEdit 
        ? `http://localhost:8000/api/nginx/zones/${editingNginxZoneId}` 
        : "http://localhost:8000/api/nginx/zones/";
      const method = isEdit ? "PUT" : "POST";
      const payload = {
         ...nginxFormData,
         ssl_enabled: nginxFormData.ssl_enabled === 1
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsNginxZoneModalOpen(false);
        loadData();
      } else {
        alert("保存 Nginx 虚拟主机失败");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openNginxUpstreamModal = (us?: NginxUpstreamNode) => {
    if (us) {
      setEditingNginxUpstreamId(us.id);
      setNginxUpstreamFormData({ ip_address: us.ip_address, port: us.port, weight: us.weight, zone_id: us.zone_id ?? null });
    } else {
      setEditingNginxUpstreamId(null);
      setNginxUpstreamFormData({ ip_address: "", port: 8080, weight: 10, zone_id: null });
    }
    setIsNginxUpstreamModalOpen(true);
  };

  const handleNginxUpstreamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = editingNginxUpstreamId !== null;
      const url = isEdit 
        ? `http://localhost:8000/api/nginx/upstreams/${editingNginxUpstreamId}` 
        : "http://localhost:8000/api/nginx/upstreams/";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify(nginxUpstreamFormData)
      });
      if (res.ok) {
        setIsNginxUpstreamModalOpen(false);
        loadData();
      } else {
        alert("保存 Nginx 后端代理失败");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const [nginxDeleteConfirmModal, setNginxDeleteConfirmModal] = useState<{isOpen: boolean; type: string; id: number | null}>({isOpen: false, type: '', id: null});

  const deleteNginxEntity = (e: React.MouseEvent, type: string, id: number) => {
     e.preventDefault();
     e.stopPropagation();
     setNginxDeleteConfirmModal({isOpen: true, type, id});
  };

  const handleConfirmDeleteNginx = async () => {
     if (!nginxDeleteConfirmModal.id) return;
     const { type, id } = nginxDeleteConfirmModal;
     let url = '';
     if (type === 'cluster') url = `http://localhost:8000/api/nginx/clusters/${id}`;
     if (type === 'zone') url = `http://localhost:8000/api/nginx/zones/${id}`;
     if (type === 'upstream') url = `http://localhost:8000/api/nginx/upstreams/${id}`;
     
     try {
         const res = await fetch(url, { method: "DELETE", headers: { "Authorization": `Bearer ${authToken}` } });
         if(res.ok) {
            setNginxDeleteConfirmModal({isOpen: false, type: '', id: null});
            loadData();
         }
     } catch (err) { 
         console.error(err); 
     }
  };

  const parseIps = (str: string) => {
      if(!str) return [];
      const parts = str.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      const res: string[] = [];
      for (const p of parts) {
          if (p.includes("-")) {
              const [start, end] = p.split("-").map(s => s.trim());
              const startParts = start.split(".");
              const endParts = end.split(".");
              if(startParts.length === 4 && endParts.length === 4 && 
                 startParts[0] === endParts[0] && startParts[1] === endParts[1] && startParts[2] === endParts[2]) {
                  const s = parseInt(startParts[3]);
                  const e = parseInt(endParts[3]);
                  for(let i = s; i <= e; i++) {
                      res.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
                  }
              } else {
                  res.push(start);
              }
          } else {
              res.push(p);
          }
      }
      return res;
  }

  const handleAddVip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { targetCabinetId, ...cleanVipData } = vipFormData;
      const basePayload = {
        virtual_ipaddress: cleanVipData.vipAddress,
        wan_ip: cleanVipData.wanIpsInput || undefined,
        port: cleanVipData.port,
        app: cleanVipData.serviceName,
        delay_loop: cleanVipData.healthCheckInterval,
        lb_algo: cleanVipData.lbAlgorithm,
        lb_kind: cleanVipData.forwardingMode,
      };

      if (editingVipId) {
         // 单节点接管更新 (PUT)
         const res = await fetch(`http://localhost:8000/api/vips/${editingVipId}`, {
             method: "PUT",
             headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
             body: JSON.stringify(basePayload)
         });

         if (res.ok) {
            if (targetCabinetId) {
               const targetNodes = nodes.filter(n => (n as any).infra_cabinet_id === targetCabinetId);
                for (const tNode of targetNodes) {
                    await fetch(`http://localhost:8000/api/vips/${editingVipId}/attach/${tNode.id}/`, {
                        method: "POST", headers: { "Authorization": `Bearer ${authToken}` }
                    });
                }
             }
         }
      } else {
         // 单点新建模式 (POST)
         const res = await fetch("http://localhost:8000/api/vips/", {
             method: "POST",
             headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
             body: JSON.stringify(basePayload)
         });

         if (res.ok) {
             const createdVip = await res.json();
             if (targetCabinetId) {
                const targetNodes = nodes.filter(n => (n as any).infra_cabinet_id === targetCabinetId);
                for (const tNode of targetNodes) {
                    await fetch(`http://localhost:8000/api/vips/${createdVip.id}/attach/${tNode.id}/`, {
                        method: "POST", headers: { "Authorization": `Bearer ${authToken}` }
                    });
                }
             }
         }
      }
      setIsVipModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to manipulate VIP(s)", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEip = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEipId) {
         // 编辑模式下取第一行覆盖全量
         const payload: any = { ...eipFormData, ip_address: eipEntries[0].ip_address, target_internal_ip: eipEntries[0].target_internal_ip, vip_id: eipFormData.asset_type === "PUBLIC_EIP" ? null : null };
         // 注意：此处的 vip_id 逻辑在表单交互处处理，上面做个简化，实际会根据是否有目标自动落库
         if (payload.target_internal_ip) {
            const matchVip = vips.find(v => v.vipAddress === payload.target_internal_ip);
            payload.vip_id = matchVip ? matchVip.id : null;
         }

         await fetch(`http://localhost:8000/api/eips/${editingEipId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
         });
      } else {
         // 新增模式：过滤空行，并发抛出
         const validEntries = eipEntries.filter(entry => entry.ip_address.trim() !== "");
         const promises = validEntries.map(entry => {
             const payload: any = { ...eipFormData, ip_address: entry.ip_address.trim(), target_internal_ip: entry.target_internal_ip };
             if (payload.target_internal_ip) {
                const matchVip = vips.find(v => v.vipAddress === payload.target_internal_ip);
                payload.vip_id = matchVip ? matchVip.id : null;
             }
             return fetch("http://localhost:8000/api/eips/", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(payload)
             });
         });
         await Promise.all(promises);
      }
      setIsEipModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to manipulate EIP", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { targetCabinetId, targetVipId, ...cleanServerData } = serverFormData;
      const baseServerPayload = {
        servername: cleanServerData.serverName,
        serverip: cleanServerData.serverIp,
        serverlip: cleanServerData.serverPrivateIp,
        port: cleanServerData.port,
        weight: cleanServerData.weight,
        onoff: cleanServerData.status,
      };
      if (editingServerId) {
         // 单点接管更新模式 (PUT)
         const res = await fetch(`http://localhost:8000/api/servers/${editingServerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
            body: JSON.stringify(baseServerPayload)
         });
         if (res.ok) {
            // 目前并未强制清理原本存在的 VIP关联或者覆盖，以防多网卡挂载丢失。
            if (targetVipId) {
               await fetch(`http://localhost:8000/api/servers/${editingServerId}/attach/${targetVipId}`, { method: "POST", headers: { "Authorization": `Bearer ${authToken}` } });
            }
         }
      } else {
         // 批量注入新建模式 (POST)
         const ips = parseIps(serverFormData.serverIp);
         if (ips.length === 0) { setSubmitting(false); return; }

         const reqs = ips.map(async (ip, idx) => {
             const suffix = ips.length > 1 ? `-${idx+1}` : "";
             const payload = { ...baseServerPayload, serverip: ip, servername: `${baseServerPayload.servername}${suffix}` };
             
             const res = await fetch("http://localhost:8000/api/servers/", {
               method: "POST",
               headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
               body: JSON.stringify(payload)
             });
             
             if (res.ok) {
               const createdSrv = await res.json();
               if (targetVipId) {
                 await fetch(`http://localhost:8000/api/servers/${createdSrv.id}/attach/${targetVipId}`, { method: "POST", headers: { "Authorization": `Bearer ${authToken}` } });
               }
             }
         });
         await Promise.all(reqs);
      }

      setIsServerModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Failed to inject or update Server", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachVip = async (serverId: number, vipIdStr: string) => {
    if (!vipIdStr) return;
    try {
      const res = await fetch(`http://localhost:8000/api/servers/${serverId}/attach/${vipIdStr}`, {
        method: "POST"
      });
      if (res.ok) {
        alert("Attached to VIP successfully!");
        loadData();
      } else {
        alert("Attach failed!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNginxDeploy = async (zoneId: number) => {
    setIsAnsibleModalOpen(true);
    setAnsibleLogs(["Initiating L7 Ansible Engine... Preparing execution stack."]);
    try {
      const res = await fetch(`http://localhost:8000/api/nginx/engine/apply/${zoneId}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setAnsibleLogs(data.log ? data.log.split("\n") : ["SUCCESS: Conf dispatched (No log returned)"]);
      } else {
        setAnsibleLogs(["ERROR:", data.detail || JSON.stringify(data)]);
      }
    } catch (err: any) {
      setAnsibleLogs(["NETWORK ERROR:", err.toString()]);
    }
  };

  const handleDeploy = async (node: DatacenterNode) => {
    setDeployingId(node.id);
    try {
      const res = await fetch(`http://localhost:8000/api/datacenter/${node.id}/deploy`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDeployLog({ dc: node.name, config: data.raw_config });
      } else {
        console.error("Deploy failed:", data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeployingId(null);
    }
  };

  const generateAnsibleInventory = () => {
    let inventory = "# Dynamic Infrastructure Inventory\\n\\n";
    // 聚合四层资源
    const directors = nodes.filter((n) => (n.name || "").includes("LVS"));
    if (directors.length > 0) {
       inventory += "[lvs_directors]\\n";
       directors.forEach((d: any) => { inventory += `${d.name.replace(/\\s/g,'-').toLowerCase()} ansible_host=virtual-ip-detect\\n`; });
       inventory += "\\n";
    }
    
    // 聚合七层资源
    if (nginxClusters.length > 0) {
       inventory += "[nginx_clusters]\\n";
       nginxClusters.forEach(nc => { inventory += `${nc.name.replace(/\\s/g,'_')} ansible_host=${nc.nodes_ips.split(',')[0].trim()}\\n`; });
       inventory += "\\n";
    }

    // 聚合底层计算资源
    if (servers.length > 0) {
       inventory += "[app_servers]\\n";
       servers.forEach((s) => {
         const hostName = (s.serverName || s.servername || "server").replace(/\\s/g, "_");
         const hostIp = s.serverIp || s.serverip || "127.0.0.1";
         inventory += `${hostName} ansible_host=${hostIp}\\n`;
       });
       inventory += "\\n";
    }
    return inventory;
  };

  const handleAnsibleMockDeploy = (type: string, scope: string) => {
    setDeployAuthModal({isOpen: false, type: "", scope: "global"});
    setIsAnsibleModalOpen(true);
    
    // 如果是全量 global，那就启用分次发布效果 (Rolling update)
    const isRolling = scope === "global";
    
    setAnsibleLogs([
      `> Initializing Ansible Playbook: [${type === 'lvs' ? 'LVS Stack Base Config' : 'Nginx 7-Layer Edge Delivery'}]...`,
      `> Target Architecture Scope: [${scope.toUpperCase()}]`,
      isRolling ? `> [ALERT] Global scope detected. Enforcing Serial Rolling Strategy (Batch: 3, Wait: 3s)...` : `> Scope localized. Full concurrent execution allowed.`,
      `> Gathering precise infrastructure inventory from CMDB API... OK`,
      `> Preparing execution environment sandboxes...`
    ]);

    let steps = [
      `> TASK [Gathering Facts] *********************************************************`,
      `ok: [all]`,
      `> TASK [Deploy ${type.toUpperCase()} Distributed Target Configurations] ********************************************`
    ];

    if (isRolling) {
      steps = steps.concat([
         `> [ROLLING BATCH 1] Selecting segment (3 nodes)...`,
         `changed: [node-alpha-1]`,
         `changed: [node-alpha-2]`,
         `changed: [node-alpha-3]`,
         `> [HEALTH CHECK] Pausing execution to monitor upstream health (Wait 3s)...`,
         `> [WAITING...] => PONG received from all segment 1 nodes.`,
         `> [ROLLING BATCH 2] Selecting next segment...`,
         `changed: [node-beta-4]`,
         `changed: [node-beta-5]`,
         `changed: [node-beta-6]`,
         `> [HEALTH CHECK] System stable. Proceeding...`,
      ]);
    } else {
      steps = steps.concat([
         `changed: [local-alpha-1]`,
         `changed: [local-beta-2]`,
         `changed: [local-delta-3]`,
      ]);
    }

    steps = steps.concat([
      `> TASK [Signaling Process Reloads] ***********************************************`,
      `changed: [all dynamically selected nodes]`,
      `> PLAY RECAP *********************************************************************`,
      `node-pool : ok=5    changed=3    unreachable=0    failed=0    skipped=0`,
      `> `,
      `> DEPLOYMENT PIPELINE COMPLETED WITH STATUS: SUCCESS ✅`
    ]);

    let step = 0;
    const intv = setInterval(() => {
      if (step < steps.length) {
        setAnsibleLogs(prev => [...prev, steps[step]]);
        step += 1;
      } else {
        clearInterval(intv);
      }
    }, isRolling ? 600 : 300); // 模拟全局发版的延时
  };

  const openDeployAuth = (type: string, scope: string) => {
    setDeployAuthModal({isOpen: true, type, scope});
    setDeployAuthInput("");
  };

  if (!authToken || !currentUser) {
     return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans relative overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-neutral-950 to-neutral-950 z-0 border-none"></div>
           <form onSubmit={handleLogin} className="relative z-10 bg-black/60 border border-neutral-800 backdrop-blur-xl p-10 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 text-sky-500 mb-6" />
              <h1 className="text-2xl font-bold text-white mb-2">OmniOps</h1>
              <p className="text-xs text-neutral-500 mb-8 uppercase tracking-widest">Authorized Personnel Only</p>
              
              <div className="w-full space-y-4">
                 <input 
                    type="text" 
                    placeholder="Operator ID" 
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none focus:border-sky-500/50 transition-colors"
                 />
                 <input 
                    type="password" 
                    placeholder="Passcode" 
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none focus:border-sky-500/50 transition-colors"
                 />
                 {loginError && <p className="text-red-400 text-xs font-bold bg-red-500/10 p-2 rounded">{loginError}</p>}
                 <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl mt-4 transition-all">
                    Initiate Link
                 </button>
              </div>
           </form>
        </div>
     );
  }



  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-50 font-sans overflow-hidden">
      {/* 侧边大纵深导航树 Sidebar — 支持折叠 */}
      <aside className={`border-r border-neutral-800 bg-[#0a0a0a] flex flex-col shrink-0 hidden lg:flex relative z-30 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-[68px]' : 'w-64'}`}>

         {/* Logo 区 + 折叠按钮 */}
         <div className="border-b border-neutral-800 flex items-center relative" style={{minHeight: '72px', padding: sidebarCollapsed ? '0 14px' : '0 24px'}}>
             <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 flex-1 min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}>
               <Cpu className="w-7 h-7 text-emerald-400 shrink-0" />
               {!sidebarCollapsed && (
                 <div className="min-w-0">
                   <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">OmniOps</h1>
                   <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">全局控制中心</p>
                 </div>
               )}
             </div>
             {/* 折叠触发按钮 */}
             <button
               onClick={() => setSidebarCollapsed(v => !v)}
               className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all shadow-lg z-50"
               title={sidebarCollapsed ? '展开菜单' : '折叠菜单'}
             >
               {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
             </button>
         </div>
         
         {/* 导航区 */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-1 py-4" style={{padding: sidebarCollapsed ? '16px 10px' : '16px'}}>

           {/* ── 辅助函数：渲染单个菜单按钮（折叠时显示 Tooltip） ── */}
           {(() => {
             const NavBtn = ({ tab, icon: Icon, label, activeColor, activeShadow }: { tab: string; icon: any; label: string; activeColor: string; activeShadow?: string }) => {
               const isActive = activeTab === tab;
               return (
                 <div className="relative group/nav">
                   <button
                     data-tab={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`flex items-center rounded-lg transition-all text-sm font-bold w-full ${
                       sidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                     } ${isActive ? `${activeColor} ${activeShadow || ''}` : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'}`}
                   >
                     <Icon className="w-4 h-4 shrink-0" />
                     {!sidebarCollapsed && <span className="truncate">{label}</span>}
                   </button>
                   {/* 折叠时的 Tooltip */}
                   {sidebarCollapsed && (
                     <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-bold text-neutral-200 whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-opacity shadow-xl z-50">
                       {label}
                       <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-700" />
                     </div>
                   )}
                 </div>
               );
             };

             // 分组标题按钮（展开态下可点击折叠，折叠态下变分割线）
             const SectionLabel = ({
               label, warning, expanded, onToggle
             }: { label: string; warning?: boolean; expanded: boolean; onToggle: () => void }) =>
               sidebarCollapsed ? (
                 <div className="my-1.5 border-t border-neutral-800/60" />
               ) : (
                 <button
                   onClick={onToggle}
                   className={`w-full flex items-center justify-between px-2 py-1.5 mt-2 mb-1 rounded-md group/sec transition-colors hover:bg-neutral-800/40 ${
                     warning ? 'text-amber-500/80 hover:text-amber-400' : 'text-neutral-500 hover:text-neutral-300'
                   }`}
                 >
                   <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
                   {expanded
                     ? <ChevronLeft className="w-3 h-3 rotate-90 opacity-60 group-hover/sec:opacity-100 transition-all" />
                     : <ChevronRight className="w-3 h-3 -rotate-90 opacity-60 group-hover/sec:opacity-100 transition-all" />}
                 </button>
               );

             return (
               <>
                 {/* 大盘 */}
                 <NavBtn tab="dash" icon={LayoutDashboard} label={t('nav.dash')} activeColor="bg-sky-500/10 text-sky-400" activeShadow="shadow-[inset_2px_0_0_#38bdf8]" />

                 {/* 基础架构 */}
                 <SectionLabel label={t('nav.group_infra')} expanded={isInfraSectionOpen} onToggle={() => setIsInfraSectionOpen(v => !v)} />
                 {(isInfraSectionOpen || sidebarCollapsed) && (
                   <>
                     <NavBtn tab="infra" icon={Building} label={t('nav.infra')} activeColor="bg-fuchsia-500/10 text-fuchsia-400" />
                     <NavBtn tab="eips" icon={Network} label={t('nav.eips')} activeColor="bg-sky-500/10 text-sky-400" />
                     <NavBtn tab="assets" icon={List} label={t('nav.assets')} activeColor="bg-fuchsia-500/10 text-fuchsia-400" activeShadow="shadow-[inset_2px_0_0_#d946ef]" />
                     <NavBtn tab="topology" icon={Unplug} label={t('nav.topology')} activeColor="bg-pink-500/10 text-pink-400" />
                   </>
                 )}

                 {/* LVS 四层 */}
                 <SectionLabel label={t('nav.lvs_cluster')} expanded={isLvsSectionOpen} onToggle={() => setIsLvsSectionOpen(v => !v)} />
                 {(isLvsSectionOpen || sidebarCollapsed) && (
                   <>
                     <NavBtn tab="datacenters" icon={Server} label={t('nav.schedule')} activeColor="bg-emerald-500/10 text-emerald-400" />
                     <NavBtn tab="vips" icon={Globe} label={t('nav.vips')} activeColor="bg-cyan-500/10 text-cyan-400" />
                     <NavBtn tab="servers" icon={HardDrive} label={t('nav.servers')} activeColor="bg-amber-500/10 text-amber-400" />
                   </>
                 )}

                 {/* Nginx 七层 */}
                 <SectionLabel label={t('nav.l7_gateway')} expanded={isNginxSectionOpen} onToggle={() => setIsNginxSectionOpen(v => !v)} />
                 {(isNginxSectionOpen || sidebarCollapsed) && (
                   <>
                     <NavBtn tab="nginx_clusters" icon={Layers} label={t('nav.nginx_cluster')} activeColor="bg-purple-500/10 text-purple-400" />
                     <NavBtn tab="nginx_zones" icon={Globe} label={t('nav.nginx_zone')} activeColor="bg-indigo-500/10 text-indigo-400" />
                     <NavBtn tab="nginx_upstreams" icon={HardDrive} label={t('nav.nginx_upstreams')} activeColor="bg-fuchsia-500/10 text-fuchsia-400" />
                   </>
                 )}

                 {/* 自动化 */}
                 <SectionLabel label={t('nav.group_auto')} expanded={isAutomationSectionOpen} onToggle={() => setIsAutomationSectionOpen(v => !v)} />
                 {(isAutomationSectionOpen || sidebarCollapsed) && (
                   <NavBtn tab="ansible_console" icon={Terminal} label={t('nav.ansible')} activeColor="bg-red-500/10 text-red-400" activeShadow="shadow-[inset_2px_0_0_#f87171]" />
                 )}

                 {/* 安全管控 */}
                 {currentUser?.role === 'SUPER_ADMIN' && (
                   <>
                     <SectionLabel label={t('nav.group_security')} warning expanded={isSecuritySectionOpen} onToggle={() => setIsSecuritySectionOpen(v => !v)} />
                     {(isSecuritySectionOpen || sidebarCollapsed) && (
                       <NavBtn tab="rbac_users" icon={ShieldAlert} label={t('nav.users')} activeColor="bg-amber-500/10 text-amber-500" activeShadow="shadow-[inset_2px_0_0_#f59e0b]" />
                     )}
                   </>
                 )}
               </>
             );
           })()}
         </div>
         
         {/* 底部账户识别码 */}
         <div className={`border-t border-neutral-800 bg-black/40 flex flex-col gap-2 ${sidebarCollapsed ? 'p-3 items-center' : 'p-4'}`}>
             {sidebarCollapsed ? (
               /* 折叠：只显示头像 + 退出按钮 */
               <div className="flex flex-col items-center gap-2">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentUser?.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                   {currentUser?.username.substring(0, 2).toUpperCase()}
                 </div>
                 <button onClick={logout} className="text-neutral-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-neutral-800" title={t('sys.logout')}>
                   <LogOut className="w-3.5 h-3.5" />
                 </button>
               </div>
             ) : (
               /* 展开：完整信息 */
               <>
                 <div className="flex items-center gap-2">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentUser?.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : currentUser?.role === 'OPERATOR' ? 'bg-sky-500/20 text-sky-500' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                     {currentUser?.username.substring(0, 2).toUpperCase()}
                   </div>
                   <div>
                     <div className="text-xs font-bold text-neutral-300">{currentUser?.username}</div>
                     <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{currentUser?.role}</div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                   <div className="flex bg-neutral-900 border border-neutral-700 rounded-lg overflow-hidden">
                     <button onClick={() => setLocale('zh')} className={`text-[10px] px-3 py-1.5 font-bold tracking-wider transition-colors ${locale === 'zh' ? 'bg-emerald-900/60 text-emerald-300' : 'text-neutral-500 hover:text-neutral-300'}`}>中</button>
                     <button onClick={() => setLocale('en')} className={`text-[10px] px-3 py-1.5 font-bold tracking-wider transition-colors ${locale === 'en' ? 'bg-sky-900/60 text-sky-300' : 'text-neutral-500 hover:text-neutral-300'}`}>EN</button>
                   </div>
                   <button onClick={logout} className="text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1.5 bg-neutral-900/50 hover:bg-neutral-900 px-3 py-1.5 rounded-lg border border-transparent hover:border-neutral-800 text-xs font-bold" title={t('sys.logout')}>
                     <LogOut className="w-3.5 h-3.5" /> <span>{t('sys.logout')}</span>
                   </button>
                 </div>
               </>
             )}
         </div>
       </aside>

      {/* 右侧主视窗内容区 */}
      <main className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* 小屏幕适配用的隔离 Header */}
        <header className="h-16 border-b border-neutral-800 bg-neutral-950 flex items-center px-6 lg:hidden justify-between shrink-0 hover:bg-[#0f0f0f]">
           <h1 className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2"><Cpu className="w-5 h-5 text-emerald-400"/> OmniOps</h1>
           <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-neutral-500 uppercase hidden sm:block">{t('sys.current_view')}</span>
              <button onClick={logout} className="text-neutral-500 hover:text-red-400 transition-colors bg-neutral-900 border border-neutral-800 p-2 rounded-lg" title={t('sys.logout')}>
                 <Unplug className="w-4 h-4" />
              </button>
           </div>
        </header>

        {/* 流动承载区 - 原先拥挤绝对定位全被清除 */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto relative bg-[#0f0f0f]">

      {/* 核心网络节点展示区 */}
      {/* 极客风格全局操控仪表盘 */}
      {activeTab === "dash" && !loading && (
        <div className="space-y-6">
          {/* ── 页头 ── */}
          <div className="flex justify-between items-start w-full border-b border-indigo-900/30 pb-4 relative">
            <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-cyan-400 to-transparent" />
            <div className="flex items-center gap-4">
              <LayoutDashboard className="w-8 h-8 text-sky-400 bg-sky-900/20 p-1.5 rounded-lg border border-sky-800/50" />
              <div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-md tracking-tight">{t('dash.main_title')}</h2>
                <p className="text-xs text-indigo-300 mt-2 tracking-widest uppercase opacity-80 flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-sky-400" />
                  {t('dash.main_desc')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end hidden sm:flex">
              <div className="px-3 py-1 bg-green-950/40 border border-green-800/50 rounded-md font-mono text-[10px] text-green-400 uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(34,197,94,0.15)]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />SYSTEM ONLINE
              </div>
              <div className="text-[10px] text-neutral-600 font-mono mt-1 pr-1">ENCRYPTED LNK SECURE</div>
            </div>
          </div>

          {/* ── 第一行：4 宏观指标卡 ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 服务器节点 */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-2 group-hover:text-amber-500 transition-colors">{t('dash.compute')}</h3>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-black text-white group-hover:text-amber-400 transition-colors">{nodes.length}</div>
                  <span className="text-[10px] font-bold text-emerald-400 mb-1.5">↑ {t('dash.live')}</span>
                </div>
                <p className="text-amber-500/50 text-[10px] uppercase font-mono mt-2 tracking-wider">{t('dash.compute_desc')}</p>
              </div>
              <HardDrive className="w-11 h-11 text-neutral-800 group-hover:text-amber-500/30 group-hover:scale-110 transition-all duration-500 relative z-10" />
            </div>

            {/* 四层调度器 */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">{t('dash.l4')}</h3>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors">{servers.length}</div>
                  {servers.length > 0 && <span className="text-[10px] font-bold text-emerald-400 mb-1.5">HA</span>}
                </div>
                <p className="text-emerald-500/50 text-[10px] uppercase font-mono mt-2 tracking-wider">{t('dash.l4_desc')}</p>
              </div>
              <Building className="w-11 h-11 text-neutral-800 group-hover:text-emerald-500/30 group-hover:scale-110 transition-all duration-500 relative z-10" />
            </div>

            {/* 七层网关 */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">{t('dash.l7')}</h3>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-black text-white group-hover:text-indigo-400 transition-colors">{nginxClusters.length}</div>
                  {nginxZones.length > 0 && <span className="text-[10px] font-bold text-indigo-400 mb-1.5">{nginxZones.length} VHost</span>}
                </div>
                <p className="text-indigo-500/50 text-[10px] uppercase font-mono mt-2 tracking-wider">{t('dash.l7_desc', {count: nginxZones.length.toString()})}</p>
              </div>
              <Layers className="w-11 h-11 text-neutral-800 group-hover:text-indigo-500/30 group-hover:scale-110 transition-all duration-500 relative z-10" />
            </div>

            {/* 活跃路由数 */}
            <div className="bg-neutral-900/80 border border-neutral-800 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden group hover:border-fuchsia-500/40 hover:shadow-[0_0_20px_rgba(217,70,239,0.1)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <h3 className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest mb-2 group-hover:text-fuchsia-400 transition-colors">{t('dash.routes')}</h3>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-black text-white group-hover:text-fuchsia-400 transition-colors">{vips.length + nginxUpstreams.length}</div>
                  <span className="text-[10px] font-bold text-fuchsia-400 mb-1.5 opacity-70">{vips.length} VIP</span>
                </div>
                <p className="text-fuchsia-500/50 text-[10px] uppercase font-mono mt-2 tracking-wider">{t('dash.routes_desc')}</p>
              </div>
              <Network className="w-11 h-11 text-neutral-800 group-hover:text-fuchsia-500/30 group-hover:scale-110 transition-all duration-500 relative z-10" />
            </div>
          </div>

          {/* ── 第二行：实时监控 + 资源汇总 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* 左：实时并发连接监控图（占 3/5） */}
            <div className="lg:col-span-3 border border-sky-900/30 bg-neutral-900/80 rounded-2xl p-6 flex flex-col relative overflow-hidden" style={{minHeight: '220px'}}>
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(56,189,248,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.2) 1px, transparent 1px)', backgroundSize: '1.5rem 1.5rem' }} />
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-sky-300 flex items-center gap-2"><Activity className="w-4 h-4"/> {t('dash.telemetry')}</h3>
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{t('dash.live')}
                </span>
              </div>
              <div className="flex-1 flex items-end justify-between gap-1.5 px-2 relative z-10" style={{minHeight: '120px'}}>
                {pulseData.map((val, idx) => (
                  <div key={idx} className="w-full bg-gradient-to-t from-sky-900/40 to-sky-500/40 rounded-t-sm relative transition-all duration-300" style={{height: `${val}%`}}>
                    <div className="absolute inset-x-0 top-0 h-1 bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,1)]" />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-sky-500/10 to-transparent z-0 pointer-events-none" />
            </div>

            {/* 右：资源汇总列表（占 2/5） */}
            <div className="lg:col-span-2 border border-neutral-800/80 bg-neutral-900/60 rounded-2xl p-5 flex flex-col gap-3">
              <h3 className="font-bold text-neutral-300 text-sm mb-1">资源汇总</h3>
              {[
                { label: 'LVS 节点', value: nodes.length, unit: '台', color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800/30' },
                { label: 'Real Server', value: servers.length, unit: '台', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-800/30' },
                { label: 'VIP 地址', value: vips.length, unit: '个', color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-800/30' },
                { label: 'Nginx 集群', value: nginxClusters.length, unit: '个', color: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-800/30' },
                { label: '公网 EIP', value: eips.length, unit: '个', color: 'text-sky-400', bg: 'bg-sky-900/20', border: 'border-sky-800/30' },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${item.bg} ${item.border}`}>
                  <span className="text-xs text-neutral-400 font-medium">{item.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-black ${item.color}`}>{item.value}</span>
                    <span className="text-[10px] text-neutral-500">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 第三行：快速操作 3 列 ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-neutral-300 text-sm">{t('dash.command')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 下发 LVS 配置 */}
              <button
                onClick={() => { setActiveTab("ansible_console"); setTimeout(() => openDeployAuth('lvs', 'all'), 200); }}
                className="relative border border-red-900/50 bg-neutral-900/80 hover:bg-red-950/30 rounded-2xl p-6 text-left transition-all duration-300 flex flex-col group overflow-hidden hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] hover:-translate-y-0.5 hover:border-red-700/60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <ShieldAlert className="w-7 h-7 text-red-500 group-hover:scale-110 group-hover:text-red-400 transition-transform duration-300 mb-4 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]"/>
                <h4 className="font-bold text-red-400 mb-2 tracking-wide">{t('dash.lvs_ansible')}</h4>
                <p className="text-xs text-red-500/60 font-mono leading-relaxed">{t('dash.lvs_ansible_desc')}</p>
                <div className="mt-4 flex items-center gap-1 text-[10px] text-red-500/50 font-bold uppercase tracking-widest">
                  <span>立即执行</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>

              {/* 下发 Nginx 配置 */}
              <button
                onClick={() => { setActiveTab("ansible_console"); setTimeout(() => openDeployAuth('nginx', 'all'), 200); }}
                className="relative border border-indigo-900/50 bg-neutral-900/80 hover:bg-indigo-950/30 rounded-2xl p-6 text-left transition-all duration-300 flex flex-col group overflow-hidden hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] hover:-translate-y-0.5 hover:border-indigo-700/60"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <Layers className="w-7 h-7 text-indigo-400 group-hover:scale-110 group-hover:text-indigo-300 transition-transform duration-300 mb-4 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]"/>
                <h4 className="font-bold text-indigo-400 mb-2 tracking-wide">{t('dash.nginx_ansible')}</h4>
                <p className="text-xs text-indigo-400/60 font-mono leading-relaxed">{t('dash.nginx_ansible_desc')}</p>
                <div className="mt-4 flex items-center gap-1 text-[10px] text-indigo-500/50 font-bold uppercase tracking-widest">
                  <span>立即执行</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>

              {/* 资产全局审查 */}
              <button
                onClick={() => setActiveTab("assets")}
                className="relative border border-neutral-700/80 bg-neutral-900/80 hover:bg-neutral-800/60 rounded-2xl p-6 text-left transition-all duration-300 flex flex-col group overflow-hidden hover:border-neutral-500/60 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.03)_50%,transparent_75%)] bg-[length:250%_250%] bg-[position:-100%_0] group-hover:bg-[position:200%_0] transition-[background-position] duration-1000" />
                <Archive className="w-7 h-7 text-neutral-500 group-hover:text-white transition-colors duration-300 mb-4"/>
                <h4 className="font-bold text-neutral-300 mb-2 tracking-wider">{t('dash.audit')}</h4>
                <p className="text-xs text-neutral-500 font-mono leading-relaxed">{t('dash.audit_desc')}</p>
                <div className="mt-4 flex items-center gap-1 text-[10px] text-neutral-600 font-bold uppercase tracking-widest group-hover:text-neutral-400 transition-colors">
                  <span>查看资产</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全局资产表呈现 */}
      {activeTab === "assets" && !loading && (() => {
         const flattenedAssets: any[] = [];
         if (Array.isArray(infraData)) {
            infraData.forEach((dc: any) => {
               if (dc.rooms && dc.rooms.length > 0) {
                  dc.rooms.forEach((room: any) => {
                     if (room.cabinets && room.cabinets.length > 0) {
                        room.cabinets.forEach((cab: any) => {
                           flattenedAssets.push({ dcName: dc.name, dcCode: dc.code, roomName: room.name, roomCode: room.code, cabName: cab.name, cabCode: cab.code, cabId: cab.id });
                        });
                     } else {
                        flattenedAssets.push({ dcName: dc.name, dcCode: dc.code, roomName: room.name, roomCode: room.code, cabName: '-', cabCode: '-', cabId: null });
                     }
                  });
               } else {
                  flattenedAssets.push({ dcName: dc.name, dcCode: dc.code, roomName: '-', roomCode: '-', cabName: '-', cabCode: '-', cabId: null });
               }
            });
         }

         return (
            <div className="flex-1 w-full bg-neutral-950 p-6 flex flex-col gap-6 overflow-y-auto">
               <div className="flex justify-between items-end w-full border-b border-fuchsia-900/30 pb-4 relative mt-2 shrink-0">
                  <div className="absolute bottom-0 left-0 w-32 h-[1px] bg-gradient-to-r from-fuchsia-500 to-transparent"></div>
                  <div className="flex items-center gap-4">
                     <List className="w-8 h-8 text-fuchsia-400 bg-fuchsia-900/20 p-1.5 rounded-lg border border-fuchsia-800/50" />
                     <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-fuchsia-400 via-pink-400 to-rose-500 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(232,121,249,0.3)] tracking-tight">{t('assets.title')}</h2>
                        <p className="text-xs text-fuchsia-300 mt-2 tracking-widest uppercase opacity-80 font-mono">
                           {t('assets.desc')}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                     <thead className="bg-fuchsia-950/20 text-fuchsia-300 border-b border-fuchsia-500/20 text-[11px] uppercase tracking-widest">
                        <tr>
                           <th className="p-4 font-semibold hover:bg-white/5 transition-colors cursor-default">{t('assets.l1')}</th>
                           <th className="p-4 font-semibold hover:bg-white/5 transition-colors cursor-default">{t('assets.l1_code')}</th>
                           <th className="p-4 font-semibold hover:bg-white/5 transition-colors cursor-default">{t('assets.l2')}</th>
                           <th className="p-4 font-semibold hover:bg-white/5 transition-colors cursor-default">{t('assets.l2_code')}</th>
                           <th className="p-4 font-semibold hover:bg-white/5 transition-colors cursor-default">{t('assets.l3')}</th>
                           <th className="p-4 font-semibold hover:bg-white/5 transition-colors cursor-default">{t('assets.l3_code')}</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-800/50">
                        {flattenedAssets.length > 0 ? flattenedAssets.map((asset, idx) => (
                           <tr key={idx} className="hover:bg-fuchsia-900/10 transition-colors group">
                              <td className="p-4 text-white font-medium flex items-center gap-2"><Globe className="w-4 h-4 text-neutral-500 group-hover:text-fuchsia-400 transition-colors" /> {asset.dcName}</td>
                              <td className="p-4 font-mono text-fuchsia-500/80 group-hover:text-fuchsia-400">{asset.dcCode || '-'}</td>
                              <td className="p-4 text-neutral-300"><div className="flex items-center gap-2"><Building className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" /> {asset.roomName}</div></td>
                              <td className="p-4 font-mono text-emerald-400/80 group-hover:text-emerald-400">{asset.roomCode || '-'}</td>
                              <td className="p-4 text-neutral-400"><div className="flex items-center gap-2"><Server className="w-4 h-4 text-amber-500/50 group-hover:text-amber-400 transition-colors" /> {asset.cabName}</div></td>
                              <td className="p-4 font-mono text-amber-500/80 group-hover:text-amber-400">{asset.cabCode || '-'}</td>
                           </tr>
                        )) : (
                           <tr>
                              <td colSpan={6} className="p-16 text-center text-neutral-500 font-mono text-xs whitespace-pre-wrap">
                                 {t('assets.empty')}
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         );
      })()}

      {activeTab === "topology" && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-pink-500">
            <Unplug className="w-5 h-5" />
            {t('topo.title')}
          </h2>
          <div className="flex flex-col gap-10 bg-neutral-900/50 p-6 rounded-2xl border border-pink-900/30 overflow-x-auto">
            {infraData.flatMap(cluster => cluster.rooms?.flatMap((room: any) => room.cabinets?.map((cab: any) => {
               // 查找挂在这个机柜上的 VIP 与 Nginx
               const mountedVips = vips.filter((vip: any) => vip.datacenters?.some((d: any) => d.infra_cabinet_id === cab.id));
               const mountedNginxClusters = nginxClusters.filter((c: any) => c.infra_cabinet_id === cab.id);
               
               return (
                 <div key={`cab-${cab.id}`} className="flex items-start gap-8">
                    {/* Layer 1: Datacenter (机柜层) */}
                    <div className="w-64 bg-neutral-800 border-l-4 border-indigo-500 rounded-lg p-4 shrink-0 relative flex flex-col gap-2">
                        <div className="text-xs font-bold text-neutral-400">[{cluster.name}] / {room.name}</div>
                        <div className="text-indigo-400 font-bold">{cab.name}</div>
                    </div>
                    
                    {/* Pipeline */}
                    <div className="flex flex-col gap-6 relative">
                        {/* 左侧垂直干线串联同一层级的 VIP */}
                        {mountedVips.length > 1 && <div className="absolute -left-8 top-8 bottom-8 border-l-2 border-dashed border-cyan-500/40"></div>}
                        
                        {mountedVips.map((vip: any, vIdx: number) => {
                            const mountedServers = servers.filter((srv: any) => srv.vips?.some((v: any) => v.id === vip.id));
                            return (
                                <div key={`tvip-${vip.id}`} className="flex items-start gap-8 relative">
                                    {/* 物理总线连接器 (虚线) */}
                                    <div className="absolute -left-8 top-8 w-8 border-t-2 border-dashed border-cyan-500/40"></div>

                                    {/* Layer 2: VIP */}
                                    <div className="w-72 bg-neutral-900 border border-cyan-500/30 rounded-lg p-4 flex flex-col gap-2 shrink-0 z-10 group/vip">
                                        <div className="flex justify-between items-start">
                                             <div className="flex flex-col gap-1">
                                                 <span className="text-cyan-400 font-mono font-bold">{vip.vipAddress}:{vip.port}</span>
                                                 {vip.eips && vip.eips.length > 0 && vip.eips.map((eip: any) => (
                                                     <span key={`waneip-${eip.id}`} className="text-[10px] text-sky-400 font-bold bg-sky-900/20 px-1 py-0.5 rounded border border-sky-900/50 w-fit">WAN: {eip.ip_address}</span>
                                                 ))}
                                             </div>
                                             <div className="flex flex-col items-end gap-1">
                                                 <div className="flex items-center gap-1">
                                                     <span className="text-[10px] px-2 py-1 bg-cyan-900/30 text-cyan-300 rounded border border-cyan-800/50">{vip.lbAlgorithm} / {vip.forwardingMode}</span>
                                                     <button onClick={(e) => { e.stopPropagation(); openVipModal(vip); }} className="text-neutral-500 hover:text-cyan-400 p-1 rounded-md transition-opacity opacity-0 group-hover/vip:opacity-100"><Settings className="w-3.5 h-3.5"/></button>
                                                 </div>
                                             </div>
                                        </div>
                                        <div className="text-xs text-neutral-500 font-mono tracking-widest">{vip.app}</div>
                                    </div>

                                    {/* Pipeline to RS */}
                                    <div className="flex flex-col gap-3 relative">
                                        {/* VIP 往下延伸包揽多个 RS 的竖直线段 */}
                                        {mountedServers.length > 1 && <div className="absolute -left-8 top-8 bottom-7 border-l-2 border-dashed border-amber-500/40"></div>}

                                        {mountedServers.map((srv: any, sIdx: number) => (
                                            <div key={`tsrv-${srv.id}`} className="relative flex items-center">
                                                <div className="absolute -left-8 top-1/2 w-8 border-t-2 border-dashed border-amber-500/40"></div>

                                                {/* Layer 3: Server */}
                                                <div className="bg-black border border-amber-500/20 rounded-md p-3 w-64 flex justify-between items-center z-10 shrink-0 group">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-amber-400 font-mono text-sm">{srv.serverIp}:{srv.port}</span>
                                                        <span className="text-[10px] text-neutral-600 font-bold uppercase">{srv.serverName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                       <button onClick={(e) => { e.stopPropagation(); openServerModal(srv as any); }} className="text-neutral-600 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"><Settings className="w-3.5 h-3.5"/></button>
                                                       <div className={`w-2 h-2 rounded-full ${srv.status === 'ON' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {mountedServers.length === 0 && (
                                            <div className="relative flex items-center h-[74px]">
                                                <div className="absolute -left-8 top-1/2 w-8 border-t-2 border-dashed border-neutral-700/50"></div>
                                                <div className="bg-black/30 border border-dashed border-neutral-800 rounded-md p-3 w-48 flex items-center justify-center text-[10px] text-neutral-600 tracking-widest font-bold">{t('topo.no_backend')}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {mountedVips.length === 0 && mountedNginxClusters.length === 0 && (
                            <div className="relative flex items-center h-[74px]">
                                <div className="absolute -left-8 top-1/2 w-8 border-t-2 border-dashed border-neutral-700/50"></div>
                                <div className="bg-transparent border border-dashed border-neutral-800 rounded-md p-4 w-64 flex items-center justify-center text-[10px] text-neutral-600 tracking-widest font-bold">{t('topo.no_probe')}</div>
                            </div>
                        )}

                       {/* 七层网关渲染部分 (Layer 7) */}
                       {mountedNginxClusters.length > 0 && (
                          <div className="flex flex-col gap-6 relative mt-2 border-t border-dashed border-purple-900/50 pt-8 w-full">
                             {mountedNginxClusters.map((nc: any) => (
                                 <div key={`tnc-${nc.id}`} className="flex items-start gap-8 relative">
                                    {/* 连接线 */}
                                    <div className="absolute -left-8 top-8 w-8 border-t-2 border-solid border-purple-500/40"></div>
                                    
                                    {/* Layer 7: Nginx Cluster */}
                                    <div className="w-80 bg-neutral-900 border-2 border-purple-500/50 rounded-xl p-5 flex flex-col gap-3 shrink-0 z-10 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative overflow-hidden group/nc">
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-400 to-indigo-600"></div>
                                        <div className="flex justify-between items-start pl-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-purple-300 font-bold text-lg">{nc.name}</span>
                                                <span className="text-[10px] text-purple-400/70 font-mono tracking-widest uppercase">App Gateway Cluster</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); openNginxClusterModal(nc); }} className="text-neutral-500 hover:text-purple-400 p-1 bg-neutral-800 rounded transition-colors opacity-0 group-hover/nc:opacity-100"><Settings className="w-3.5 h-3.5"/></button>
                                        </div>
                                        {nc.nodes_ips && (
                                            <div className="pl-2 flex flex-wrap gap-2 mt-1">
                                                {nc.nodes_ips.split(',').map((ip: string) => (
                                                    <span key={ip} className="text-xs text-neutral-300 bg-neutral-800 px-2 py-1 rounded-md border border-neutral-700/50 font-mono flex items-center gap-1">
                                                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {ip.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Layer 7 下挂的 Zones */}
                                    {nc.zones && nc.zones.length > 0 && (
                                        <div className="flex flex-col gap-4 relative mt-2">
                                           {nc.zones.map((zone: any) => (
                                              <div key={`tzone-${zone.id}`} className="flex items-center gap-4 relative">
                                                  <div className="absolute -left-8 top-1/2 w-8 border-t border-dashed border-indigo-500/30"></div>
                                                  <div className="w-64 bg-neutral-950 border border-indigo-500/20 rounded-lg p-3 relative flex flex-col gap-1 hover:border-indigo-500/50 transition-colors">
                                                      <div className="text-indigo-400 font-bold text-sm tracking-wide">{zone.domain}</div>
                                                      <div className="text-[10px] text-neutral-500 flex justify-between">
                                                          <span>Port: <span className="text-neutral-300">{zone.listen_port}</span></span>
                                                          <span className={zone.ssl ? "text-emerald-500" : "text-neutral-600"}>{zone.ssl ? "HTTPS/TLS" : "HTTP"}</span>
                                                      </div>
                                                  </div>
                                              </div>
                                           ))}
                                        </div>
                                    )}
                                 </div>
                             ))}
                          </div>
                        )}
                    </div>
                 </div>
               );
            })))}
          </div>
        </section>
      )}
      {activeTab === "datacenters" && (
      <section>
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-neutral-200">
          <Server className="w-5 h-5 text-indigo-400" />
          {t('lvs.director_title')}
        </h2>

        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-xl bg-neutral-800 h-32 w-full md:w-1/3"></div>
            <div className="rounded-xl bg-neutral-800 h-32 w-full md:w-1/3"></div>
          </div>
        ) : (() => {
            const unassigned: DatacenterNode[] = [];
            const hierarchy: Record<string, Record<string, Record<string, DatacenterNode[]>>> = {};

            // 1. 正向根据物理架构初始化全量树 (解决空机房不显示的问题)
            if (Array.isArray(infraData)) {
               infraData.forEach((dc: any) => {
                  if (!hierarchy[dc.name]) hierarchy[dc.name] = {};
                  if (dc.rooms) {
                     dc.rooms.forEach((room: any) => {
                        if (!hierarchy[dc.name][room.name]) hierarchy[dc.name][room.name] = {};
                        if (room.cabinets) {
                           room.cabinets.forEach((cab: any) => {
                              hierarchy[dc.name][room.name][cab.name] = []; // 预先建立空插槽插口
                           });
                        }
                     });
                  }
               });
            }

            nodes.forEach(node => {
               let matched = false;
               if (node.infraCabinetId && Array.isArray(infraData)) {
                  infraData.forEach((dc: any) => {
                     if (dc.rooms) dc.rooms.forEach((room: any) => {
                        if (room.cabinets) room.cabinets.forEach((cab: any) => {
                           if (cab.id === node.infraCabinetId) {
                              matched = true;
                              if (!hierarchy[dc.name]) hierarchy[dc.name] = {};
                              if (!hierarchy[dc.name][room.name]) hierarchy[dc.name][room.name] = {};
                              if (!hierarchy[dc.name][room.name][cab.name]) hierarchy[dc.name][room.name][cab.name] = [];
                              hierarchy[dc.name][room.name][cab.name].push(node);
                           }
                        });
                     });
                  });
               }
               if (!matched) unassigned.push(node);
            });

            const renderNodeCard = (node: DatacenterNode) => (
              <div
                key={node.id}
                className="group relative flex flex-col gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 transition-all hover:bg-neutral-800/80 hover:border-neutral-700 hover:shadow-2xl hover:shadow-emerald-900/20"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <span>{node.name}</span>
                      <span className="text-[10px] font-mono bg-neutral-800/80 text-neutral-400 px-2 py-0.5 rounded-full border border-neutral-700">
                        VRID: {node.vrrpRouterId || "N/A"}
                      </span>
                    </h3>
                  </div>
                  
                  <div
                    className={`px-2 py-1 text-xs font-bold rounded-md shrink-0 ${
                      node.haRole === "MASTER"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {node.haRole}
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Activity className="w-4 h-4" />
                      {t('lvs.director_wip')}
                    </div>
                    <div className="font-mono text-cyan-400 tracking-wider">
                      {node.publicIp}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Activity className="w-4 h-4 opacity-50" />
                      {t('lvs.director_lip')}
                    </div>
                    <div className="font-mono text-emerald-400/80 tracking-wider">
                      {node.privateIp || t('lvs.no_lip_status')}
                    </div>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent my-2" />

                <div className="flex justify-between items-center text-xs text-neutral-500 flex-wrap gap-2">
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSingleNodeFormData({
                          name: node.name,
                          datacenter: node.zoneCode,
                          cabinet: node.rackCode,
                          wip: node.publicIp,
                          lip: node.privateIp || "",
                          infra_cabinet_id: node.infraCabinetId || null,
                        });
                        setEditingSingleNode(node);
                      }}
                      className="flex items-center gap-1 text-amber-500/80 hover:text-amber-400 transition-colors"
                    >
                      {t('lvs.director_edit_btn')}
                    </button>
                    <button 
                      onClick={(e) => {
                         e.stopPropagation();
                         const groupNodes = nodes.filter(n => n.vrrpRouterId === node.vrrpRouterId);
                         const masterNode = groupNodes.find(n => n.haRole === 'MASTER');
                         const backupNode = groupNodes.find(n => n.haRole === 'BACKUP');
                         if(masterNode && backupNode) {
                            setEditingGroupIds({masterId: masterNode.id, backupId: backupNode.id});
                            setFormData({
                              master_name: masterNode.name,
                              backup_name: backupNode.name,
                              datacenter: masterNode.zoneCode,
                              cabinet: masterNode.rackCode,
                              infra_cabinet_id: masterNode.infraCabinetId || null,
                              gid: masterNode.vrrpGroupId || 2001,
                              wip_master: masterNode.publicIp,
                              lip_master: masterNode.privateIp || '',
                              wip_backup: backupNode.publicIp,
                              lip_backup: backupNode.privateIp || '',
                              router_id: masterNode.routerId ? masterNode.routerId.replace('_1','') : 'LVS_DR',
                              virtual_router_id: masterNode.vrrpRouterId || node.vrrpRouterId || 52
                            });
                            setIsModalOpen(true);
                         } else {
                            alert(t('lvs.director_no_pair'));
                         }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 text-emerald-400 bg-emerald-900/20 border border-emerald-500/20 rounded-md hover:bg-emerald-900/50 transition-colors"
                    >
                      <Settings className="w-3 h-3" /> {t('lvs.director_matrix_btn')}
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeploy(node); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/60 border border-indigo-500/20 rounded-md transition-colors text-xs font-semibold shadow-lg shadow-indigo-900/20 shrink-0 ml-auto"
                  >
                    {deployingId === node.id ? <span className="animate-spin text-indigo-400">⟳</span> : <Terminal className="w-3 h-3" />}
                    {t('lvs.director_deploy_btn')}
                  </button>
                </div>
              </div>
            );

            return (
               <div className="flex flex-col gap-6">
                 {/* 渲染层级的拓扑树区域 */}
                 {Object.entries(hierarchy).map(([dcName, rooms]) => (
                    <details key={dcName} open className="border border-neutral-800 rounded-xl overflow-hidden group/dc">
                       <summary className="bg-neutral-900 border-b border-neutral-800 p-4 font-bold text-fuchsia-400 flex items-center gap-2 cursor-pointer outline-none hover:bg-neutral-800/80 transition-colors">
                          <Building className="w-5 h-5 text-fuchsia-500" />
                          <span className="text-xs font-bold px-2 py-0.5 bg-fuchsia-900/40 border border-fuchsia-500/30 text-fuchsia-400 rounded-full uppercase tracking-widest">地区</span>
                          <span>{dcName}</span>
                       </summary>
                       <div className="p-4 flex flex-col gap-4">
                          {Object.entries(rooms).map(([roomName, cabs]) => (
                             <details key={roomName} open className="border border-neutral-800/50 rounded-lg bg-neutral-900/50 overflow-hidden group/room">
                                <summary className="text-sm font-semibold text-emerald-400 p-3 bg-black/20 border-b border-neutral-800/50 cursor-pointer outline-none hover:bg-black/40 flex items-center gap-2">
                                   <Server className="w-4 h-4 text-emerald-500"/>
                                   <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 rounded-full uppercase tracking-widest">机房</span>
                                   <span>{roomName}</span>
                                </summary>
                                <div className="flex flex-col gap-4 p-4">
                                   {Object.entries(cabs).map(([cabName, cabNodes]: any) => (
                                      <div key={cabName} className="bg-black/40 rounded-md p-4 border border-neutral-800/30">
                                          <div className="text-xs font-mono text-amber-500 mb-3 flex items-center gap-2 pb-2 border-b border-neutral-800/50">
                                             <HardDrive className="w-3 h-3"/>
                                             <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-900/40 border border-amber-500/30 text-amber-400 rounded uppercase tracking-widest">机柜</span>
                                             <span className="font-bold">{cabName}</span>
                                          </div>
                                          {cabNodes.length > 0 ? (
                                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                 {cabNodes.map(renderNodeCard)}
                                              </div>
                                          ) : (
                                              <div className="text-xs font-mono text-neutral-500/80 py-4 border border-dashed border-neutral-800 rounded flex flex-col items-center justify-center gap-2">
                                                  <Unplug className="w-4 h-4"/>
                                                  {t('lvs.empty_cab')}
                                              </div>
                                          )}
                                      </div>
                                   ))}
                                </div>
                             </details>
                          ))}
                       </div>
                    </details>
                 ))}

                 {/* 渲染未绑定的节点 */}
                 {unassigned.length > 0 && (
                    <details className="border border-red-900/50 rounded-xl overflow-hidden mt-4 group/unassigned">
                       <summary className="bg-red-950/30 border-b border-red-900/50 p-4 font-bold text-red-400 flex items-center gap-2 outline-none cursor-pointer hover:bg-red-900/30">
                          <AlertTriangle className="w-5 h-5" /> {t('lvs.unassigned')}
                       </summary>
                       <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 bg-red-950/10">
                          {unassigned.map(renderNodeCard)}
                       </div>
                    </details>
                 )}

                 <div className="grid grid-cols-1 lg:grid-cols-3 mt-4">
                    <div onClick={() => { 
                       if(!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string)) return;
                       setEditingGroupIds(null); setIsModalOpen(true); 
                    }} className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-2xl p-6 transition-all min-h-[160px] ${!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? 'border-neutral-800 text-neutral-700 cursor-not-allowed bg-neutral-900/50' : 'border-emerald-900/50 text-neutral-500 hover:text-emerald-400 hover:bg-emerald-900/10 hover:border-emerald-500/50 cursor-pointer'}`}>
                      <div className={`rounded-full p-3 mb-2 transition-colors ${!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? 'bg-neutral-800' : 'bg-neutral-900 group-hover:bg-emerald-900/40'}`}>
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-sm transition-colors">{!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? t('lvs.no_auth_add') : t('lvs.auth_add')}</span>
                    </div>
                 </div>
               </div>
            );
        })()}
      </section>
      )}


      {/* DevOps: 极客配置渲染弹窗 */}
      {deployLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-10">
           <div className="bg-neutral-900 border border-neutral-800 shadow-2xl shadow-indigo-900/20 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center p-4 border-b border-indigo-900/50 bg-neutral-950">
                 <h3 className="font-bold text-lg flex items-center gap-2 text-indigo-400">
                   <Terminal className="w-5 h-5"/> 基于 ipvsadm/keepalived 底层引擎编译出的运维模板文件快照： [ {deployLog.dc} ]
                 </h3>
                 <button onClick={() => setDeployLog(null)} className="text-neutral-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <div className="p-5 overflow-y-auto bg-black text-emerald-400 font-mono text-xs md:text-sm whitespace-pre-wrap leading-relaxed">
                 {deployLog.config}
              </div>
              <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center text-xs text-neutral-500">
                 <span className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
                    {t('devops.status')}
                 </span>
                 <button onClick={() => setDeployLog(null)} className="px-5 py-2 font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">{t('common.confirm_close')}</button>
              </div>
           </div>
        </div>
      )}

      {/* 工业级正交拓扑机架视图 (Professional Rack Dashboards) */}
      {activeTab === "infra" && !loading && (
        <section className="animate-in fade-in zoom-in-95 duration-500 mb-20">
          <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
            <div>
               <h2 className="text-xl font-bold flex items-center gap-3 text-neutral-100">
                 <Server className="w-5 h-5 text-indigo-400" />
                 {t('infra.title')}
               </h2>
               <p className="text-sm text-neutral-500 mt-1 font-mono">{t('infra.subtitle')}</p>
            </div>
            <button 
               onClick={() => {
                 setInfraModalType("full_chain");
                 setInfraFormData({name: "", code: "", parent_id: 0, room_name: "", room_code: "", cabinets: [{name: "", code: ""}]});
                 setIsInfraModalOpen(true);
               }}
               className="flex items-center gap-2 text-sm bg-neutral-900 hover:bg-indigo-900 border border-neutral-700 hover:border-indigo-500 text-neutral-200 px-4 py-2 rounded-md transition-all font-mono">
               <Plus className="w-4 h-4" /> {t('infra.add_dc')}
            </button>
          </div>
          
          <div className="w-full flex flex-col gap-10">
               {!Array.isArray(infraData) || infraData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 w-full text-neutral-600 border border-neutral-800 border-dashed rounded-lg bg-neutral-900/20">
                       <Database className="w-12 h-12 mb-4 opacity-20" />
                       <p className="tracking-widest font-mono text-sm uppercase">{t('infra.no_dc')}</p>
                    </div>
               ) : (
                   infraData.map((dc: any) => (
                     <div key={dc.id} className="w-full flex flex-col gap-6 bg-transparent">
                       {/* Datacenter Header */}
                       <div className="flex items-center justify-between border-b-2 border-indigo-500/20 pb-2">
                          <h3 className="font-bold text-2xl text-neutral-200 flex items-center gap-3 font-mono uppercase tracking-wide">
                            <span className="w-3 h-3 bg-indigo-500 ml-1"></span>
                            {dc.name} 
                            <span className="text-xs text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded ml-2">Code: {dc.code || dc.id}</span>
                          </h3>
                          <button 
                            onClick={() => {
                              setInfraModalType("room");
                              setInfraFormData({name: "", code: "", parent_id: dc.id, room_name: "", room_code: "", cabinets: [{name: "", code: ""}]});
                              setIsInfraModalOpen(true);
                            }}
                            className="text-xs text-indigo-300 hover:text-white bg-neutral-900 border border-neutral-700 hover:border-indigo-500 px-3 py-1.5 rounded transition-all font-mono"
                          >{t('infra.add_room')}</button>
                       </div>
   
                       {/* Rooms Array */}
                       <div className="flex flex-col gap-8">
                          {dc.rooms && dc.rooms.length > 0 ? (
                              dc.rooms.map((room: any) => (
                                  <div key={room.id} className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 shadow-md shadow-black overflow-hidden relative">
                                      <div className="absolute top-0 left-0 w-1 h-full bg-neutral-700"></div>
                                      
                                      <div className="flex justify-between items-center mb-8 pl-4">
                                        <h4 className="font-semibold text-neutral-300 font-mono text-lg flex items-center gap-2">
                                          <Hash className="w-4 h-4 text-neutral-600" />
                                          {room.name}
                                        </h4>
                                        <button 
                                          onClick={() => {
                                            setInfraModalType("cabinet");
                                            setInfraFormData({name: "", code: "", parent_id: room.id, room_name: "", room_code: "", cabinets: [{name: "", code: ""}]});
                                            setIsInfraModalOpen(true);
                                          }}
                                          className="text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded transition-all font-mono"
                                        >{t('infra.add_rack')}</button>
                                      </div>
                                      
                                      {/* Racks Row (正统垂直机柜陈列) */}
                                      <div className="flex gap-6 flex-wrap pl-4 pb-2">
                                          {room.cabinets && room.cabinets.length > 0 ? (
                                              room.cabinets.map((cab: any) => {
                                                 const cabNodes = nodes.filter(n => (n as any).infra_cabinet_id === cab.id);
                                                 
                                                 return (
                                                     <div key={cab.id} className="w-52 bg-[#111111] border-x-[6px] border-t-[8px] border-[#222222] rounded-t flex flex-col p-2 pb-0 shadow-2xl relative select-none">
                                                         {/* 机柜名牌与顶部风扇 */}
                                                         <div className="h-6 w-full bg-black mb-3 border border-neutral-800 flex items-center justify-between px-2 overflow-hidden shadow-inner">
                                                            <div className="flex gap-[1px]">
                                                              <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                                                              <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                                                            </div>
                                                            <div className="text-[9px] font-mono text-neutral-400 tracking-wider font-bold truncate max-w-[100px]" title={cab.name}>{cab.name}</div>
                                                            <div className="flex gap-[1px]">
                                                              <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                                                              <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                                                            </div>
                                                         </div>
                                                         
                                                         {/* 服务器 U位插槽实体 */}
                                                         <div className="flex flex-col gap-1 w-full min-h-[120px] bg-[repeating-linear-gradient(0deg,transparent,transparent_11px,rgba(255,255,255,0.01)_11px,rgba(255,255,255,0.01)_12px)]">
                                                             {cabNodes.map(n => (
                                                                 <div key={n.id} className="w-full h-5 bg-neutral-800 border-[1px] border-neutral-700 flex items-center px-1.5 justify-between shadow-sm cursor-pointer hover:border-neutral-500 hover:bg-neutral-700 transition-colors">
                                                                    <div className="flex items-center gap-1.5">
                                                                       {/* Status LEDs */}
                                                                       <div className="flex gap-1">
                                                                          <div className={`w-1.5 h-1.5 rounded-full ${n.haRole === 'MASTER' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-cyan-500 shadow-[0_0_5px_#06b6d4]'}`}></div>
                                                                         <div className={`w-1.5 h-1.5 rounded-full ${(n.priority || 0) > 0 ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`}></div>
                                                                       </div>
                                                                       <span className="text-[8px] font-mono text-neutral-300 leading-none truncate w-16">{n.publicIp}</span>
                                                                    </div>
                                                                    <div className="text-[7px] text-neutral-500 font-mono flex items-center gap-1 border-l border-neutral-700 pl-1">
                                                                      <span className="w-2 h-1 bg-neutral-600 inline-block"></span>
                                                                      <span className="w-2 h-1 bg-neutral-600 inline-block"></span>
                                                                    </div>
                                                                 </div>
                                                             ))}
                                                             {cabNodes.length === 0 && (
                                                                <div className="text-[10px] text-neutral-700/50 font-mono italic text-center w-full mt-10">
                                                                   {t('infra.empty_rack')}
                                                                </div>
                                                             )}
                                                         </div>
                                                         
                                                         {/* 底脚垫高层 */}
                                                         <div className="h-6 mt-1 w-full flex items-end justify-between px-1">
                                                             <div className="w-2 h-2 bg-neutral-800 border-b border-black"></div>
                                                             <div className="w-2 h-2 bg-neutral-800 border-b border-black"></div>
                                                         </div>
                                                     </div>
                                                 )
                                              })
                                          ) : (
                                              <div className="flex flex-col items-center justify-center gap-2 py-10 border border-dashed border-neutral-800 rounded text-neutral-700 bg-[#0a0a0a]">
                                                <HardDrive className="w-6 h-6 opacity-30" />
                                                <span className="text-xs font-mono tracking-widest">{t('infra.no_rack_deployed')}</span>
                                                <span className="text-[10px] text-neutral-800">点击「添加机柜」开始添加</span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="text-sm text-neutral-600 font-mono py-12 border border-dashed border-neutral-800 text-center rounded-lg bg-neutral-900/30">{t('infra.no_room_alloc')}</div>
                          )}
                       </div>
                     </div>
                   ))
               )}
          </div>
        </section>
      )}
{/* VIP 虚拟组的呈现 */}
      {activeTab === "vips" && !loading && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-neutral-200">
            <Globe className="w-5 h-5 text-cyan-400" />
            {t('vips.title')}
          </h2>
          <div className="flex flex-col gap-6">
            {vips.length === 0 ? (
                 <div className="py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                    <Layers className="w-10 h-10 mb-4 opacity-50" />
                    <p>{t('vips.no_vips')}</p>
                 </div>
            ) : (
                (() => {
                    const groupedVips = vips.reduce<Record<string, VipNode[]>>((acc, vip) => {
                       const key = vip.serviceName || vip.app || t('vips.unassigned_app');
                       if (!acc[key]) acc[key] = [];
                       acc[key].push(vip);
                       return acc;
                    }, {});
                    
                    return Object.entries(groupedVips).map(([app, appVips]) => (
                       <details key={app} open className="col-span-full border border-cyan-900/50 rounded-xl overflow-hidden mb-2 group/app">
                          <summary className="bg-cyan-950/40 p-4 font-bold text-cyan-400 flex items-center gap-2 cursor-pointer outline-none hover:bg-cyan-900/30 border-b border-cyan-900/50">
                             <Layers className="w-5 h-5 text-cyan-500" /> {t('vips.app_cluster')} {app}
                          </summary>
                          <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 bg-black/20">
                             {(appVips as any[]).map(vip => (
                                 <div key={vip.id} className="bg-cyan-950/20 border border-cyan-800/30 rounded-2xl p-6 flex flex-col gap-3 transition-colors hover:bg-cyan-900/30 group">
                                    <div className="flex justify-between items-start">
                                       <h3 className="text-cyan-400 font-bold flex items-center gap-2 text-xl">
                                          <Globe className="w-5 h-5 opacity-70"/> {vip.vipAddress}:{vip.port}
                                       </h3>
                                       <div className="flex items-center gap-2">
                                          {vip.wan_ip && (
                                            <span className="text-xs bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-1 rounded shadow-[0_0_8px_rgba(14,165,233,0.3)] flex items-center gap-1"><Globe className="w-3 h-3"/> {vip.wan_ip}</span>
                                          )}
                                          <button onClick={() => openVipModal(vip)} className="text-neutral-500 hover:text-cyan-400 p-1 rounded-md transition-opacity opacity-0 group-hover:opacity-100"><Settings className="w-4 h-4"/></button>
                                       </div>
                                    </div>
                                    <p className="text-neutral-400 text-sm flex gap-4 flex-wrap">
                                       <span className="bg-cyan-950 px-2 py-1 rounded border border-cyan-900/50">{t('vips.algo_mode', {algo: vip.lbAlgorithm || '', mode: vip.forwardingMode || ''})}</span>
                                    </p>
                                    {(vip as any).datacenters?.length > 0 && (
                                        <div className="mt-2 text-xs text-neutral-500 bg-black/40 border border-neutral-800 rounded p-2 flex flex-wrap gap-2 items-center">
                                           <span className="text-cyan-600 font-bold flex items-center gap-1"><Server className="w-3 h-3"/> {t('vips.mounted_gtw')}</span>
                                           {(vip as any).datacenters.map((dcNode: any) => (
                                              <span key={dcNode.id} className={`${dcNode.state === "MASTER" ? "text-emerald-500 border-emerald-900/50" : "text-amber-500 border-amber-900/50"} border px-1.5 py-0.5 rounded-sm bg-neutral-900`}>{dcNode.name}</span>
                                           ))}
                                        </div>
                                    )}
                                 </div>
                             ))}
                          </div>
                       </details>
                    ));
                })()
            )}

            {/* VIP 新建卡片骨架 */}
            <div onClick={() => {
                       if(!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string)) return;
                       setIsVipModalOpen(true);
                    }} className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-6 transition-all min-h-[140px] mt-4 ${!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? 'border-neutral-800 text-neutral-700 bg-neutral-900/50 cursor-not-allowed' : 'border-cyan-900/50 hover:border-cyan-500/50 hover:bg-cyan-900/10 text-neutral-500 hover:text-cyan-400 cursor-pointer'}`}>
                      <div className={`rounded-full p-2 mb-1 ${!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? 'bg-neutral-800 text-neutral-600' : 'bg-neutral-900 text-cyan-500'}`}><Plus className="w-5 h-5" /></div>
                      <span className="font-bold text-sm tracking-wide">{!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? t('vips.no_auth') : t('vips.add')}</span>
                    </div>
          </div>
        </section>
      )}

      {/* EIP 弹性公网独立资产呈现 */}
      {activeTab === "eips" && !loading && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <div className="flex justify-between items-center bg-neutral-900/50 p-2 rounded-xl mb-4 border border-sky-900/30">
             <span className="text-sm font-bold text-sky-400 pl-4">{t('eips.title') || 'IP 资产全局调度盘'}</span>
             <div className="flex bg-neutral-950 rounded-lg p-1 border border-neutral-800">
                <button onClick={() => setEipViewDimension('TYPE')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${eipViewDimension === 'TYPE' ? 'bg-sky-900/60 text-sky-300' : 'text-neutral-500 hover:text-neutral-300'}`}>按资产类型分布</button>
                <button onClick={() => setEipViewDimension('LOCATION')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${eipViewDimension === 'LOCATION' ? 'bg-emerald-900/60 text-emerald-300' : 'text-neutral-500 hover:text-neutral-300'}`}>按物理机房拓扑分布</button>
             </div>
          </div>

          <div className="flex flex-col gap-6">
            {eips.length === 0 ? (
                 <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                    <Network className="w-10 h-10 mb-4 opacity-50 text-sky-400" />
                    <p>{t('eips.no_eips')}</p>
                 </div>
             ) : (
                 eipViewDimension === 'TYPE' ? (
                    <div className="flex flex-col gap-8">
                       <div>
                          <h3 className="text-md font-bold text-blue-400 mb-3 flex items-center gap-2"><Globe className="w-4 h-4"/> 公网出口资源池 (Public EIP)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             {eips.filter(e => e.asset_type === 'PUBLIC_EIP' || !e.asset_type).map(renderEipCard)}
                             {eips.filter(e => e.asset_type === 'PUBLIC_EIP' || !e.asset_type).length === 0 && (
                               <div className="col-span-4 py-8 border border-dashed border-blue-900/40 rounded-xl bg-blue-950/10 flex flex-col items-center justify-center gap-2 text-blue-500/50">
                                 <Globe className="w-8 h-8 opacity-40" />
                                 <p className="text-sm font-medium">还没有公网 IP 记录</p>
                                 <p className="text-xs opacity-70">点击下方「添加 IP 资产」录入第一个公网 EIP</p>
                               </div>
                             )}
                          </div>
                       </div>
                       <div>
                          <h3 className="text-md font-bold text-purple-400 mb-3 flex items-center gap-2"><Layers className="w-4 h-4"/> 虚拟内网及 VIP 预留池</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             {eips.filter(e => e.asset_type === 'VIP_RESERVED').map(renderEipCard)}
                             {eips.filter(e => e.asset_type === 'VIP_RESERVED').length === 0 && (
                               <div className="col-span-4 py-8 border border-dashed border-purple-900/40 rounded-xl bg-purple-950/10 flex flex-col items-center justify-center gap-2 text-purple-500/50">
                                 <Layers className="w-8 h-8 opacity-40" />
                                 <p className="text-sm font-medium">还没有 VIP 预留网段记录</p>
                                 <p className="text-xs opacity-70">用于 LVS 虚拟服务器内网地址预留</p>
                               </div>
                             )}
                          </div>
                       </div>
                       <div>
                          <h3 className="text-md font-bold text-emerald-500 mb-3 flex items-center gap-2"><Server className="w-4 h-4"/> 物理机柜互联骨干网段</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             {eips.filter(e => e.asset_type === 'CAB_SUBNET').map(renderEipCard)}
                             {eips.filter(e => e.asset_type === 'CAB_SUBNET').length === 0 && (
                               <div className="col-span-4 py-8 border border-dashed border-emerald-900/40 rounded-xl bg-emerald-950/10 flex flex-col items-center justify-center gap-2 text-emerald-500/50">
                                 <Server className="w-8 h-8 opacity-40" />
                                 <p className="text-sm font-medium">还没有机柜互联网段记录</p>
                                 <p className="text-xs opacity-70">用于记录机柜间物理互联地址段</p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-8">
                       <div>
                          <h3 className="text-md font-bold text-neutral-400 mb-3 flex items-center gap-2"><Cloud className="w-4 h-4"/> 全局浮动资产 (无特定绑定机房)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             {eips.filter(e => !e.infra_room_id).map(renderEipCard)}
                          </div>
                       </div>
                       {infraData.map(dc => {
                          const eipsInDc = eips.filter(e => dc.rooms?.some((r) => r.id === e.infra_room_id));
                          if (eipsInDc.length === 0) return null;
                          return (
                            <div key={`dc-dim-${dc.id}`} className="bg-neutral-900/50 p-4 rounded-2xl border border-neutral-800">
                               <h3 className="text-md font-bold text-sky-300 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4"/> 地区架构：{dc.name} ({dc.datacenter})</h3>
                               {dc.rooms?.map((room: any) => {
                                  const eipsInRoom = eips.filter(e => e.infra_room_id === room.id);
                                  if (eipsInRoom.length === 0) return null;
                                  return (
                                     <div key={`room-dim-${room.id}`} className="mb-4 pl-4 border-l-2 border-emerald-900/30">
                                        <h4 className="text-sm font-bold text-emerald-400 mb-3">{room.name}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                           {eipsInRoom.map(renderEipCard)}
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                          );
                       })}
                    </div>
                 )
             )}
            <div onClick={() => {
                       if(!['SUPER_ADMIN', 'NETWORK_ADMIN'].includes(currentUser?.role as string)) return;
                       openEipModal();
                    }} className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl p-6 transition-all min-h-[140px] mt-4 ${!['SUPER_ADMIN', 'NETWORK_ADMIN'].includes(currentUser?.role as string) ? 'border-neutral-800 text-neutral-700 bg-neutral-900/50 cursor-not-allowed' : 'border-sky-900/50 hover:border-sky-500/50 hover:bg-sky-900/10 text-neutral-500 hover:text-sky-400 cursor-pointer'}`}>
                      <div className={`rounded-full p-2 mb-1 ${!['SUPER_ADMIN', 'NETWORK_ADMIN'].includes(currentUser?.role as string) ? 'bg-neutral-800 text-neutral-600' : 'bg-neutral-900 text-sky-500'}`}><Plus className="w-5 h-5" /></div>
                      <span className="font-bold text-sm tracking-wide">{!['SUPER_ADMIN', 'NETWORK_ADMIN'].includes(currentUser?.role as string) ? t('eips.no_auth') : t('eips.add')}</span>
                    </div>
          </div>
        </section>
      )}

      {/* Nginx 七层大盘应用分发: 集群 (Clusters) */}
      {activeTab === "nginx_clusters" && !loading && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-purple-400">
            <Layers className="w-5 h-5 text-purple-400" />
            {t('nc.title')}
          </h2>
          <div className="flex flex-col gap-6">
             {nginxClusters.length === 0 ? (
                 <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                    <Layers className="w-10 h-10 mb-4 opacity-50 text-purple-400" />
                    <p>{t('nc.no_nodes')}</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {nginxClusters.map((cluster) => (
                      <div key={cluster.id} className="bg-neutral-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-bl-full -z-10 group-hover:bg-purple-500/20 transition-all pointer-events-none" />
                         <div className="flex justify-between items-start mb-6">
                            <div>
                               <div className="text-xs text-purple-400 font-bold tracking-widest uppercase mb-1">Nginx Cluster Group</div>
                               <div className="text-2xl font-bold text-white flex items-center gap-2">
                                  {cluster.name}
                               </div>
                               <div className="text-xs text-neutral-500 mt-1">{t('nc.inner_ip')} {cluster.nodes_ips}</div>
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 relative z-20">
                               <button onClick={() => openNginxClusterModal(cluster)} className="text-neutral-500 hover:text-purple-400 bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-lg transition-colors"><Settings className="w-4 h-4"/></button>
                               <button type="button" onClick={(e) => deleteNginxEntity(e, 'cluster', cluster.id)} className="text-neutral-500 hover:text-red-400 bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                         </div>
                         <div className="space-y-2 pt-2 border-t border-neutral-800">
                            {cluster.eips && cluster.eips.length > 0 ? (
                                <div className="text-xs text-neutral-400 flex items-center gap-2">
                                    <span className="bg-sky-500/20 text-sky-400 px-2 py-1 rounded shadow-[0_0_8px_rgba(14,165,233,0.3)]">{t('nc.eip_expose')}</span>
                                    {cluster.eips.map((eip) => <span key={eip.id} className="font-mono">{eip.ip_address}</span>)}
                                </div>
                            ) : (
                                <div className="text-xs text-neutral-600 italic">{t('nc.private_mode')}</div>
                            )}
                         </div>
                      </div>
                   ))}
                </div>
             )}
             <div onClick={() => openNginxClusterModal()} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-purple-900/50 hover:border-purple-500/50 hover:bg-purple-900/10 rounded-2xl p-6 transition-all min-h-[140px] text-neutral-500 hover:text-purple-400 cursor-pointer mt-4">
                <div className="bg-neutral-900 text-purple-500 rounded-full p-2 mb-1"><Plus className="w-5 h-5" /></div>
                <span className="font-bold text-sm tracking-wide">{t('nc.add')}</span>
             </div>
          </div>
        </section>
      )}

      {/* Nginx 七层大盘应用分发: 虚拟主机域 (Zones) */}
      {activeTab === "nginx_zones" && !loading && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-indigo-400">
            <Globe className="w-5 h-5 text-indigo-400" />
            {t('nz.title')}
          </h2>
          <div className="flex flex-col gap-6">
             {nginxZones.length === 0 ? (
                 <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                    <Globe className="w-10 h-10 mb-4 opacity-50 text-indigo-400" />
                    <p>{t('nz.no_zones')}</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {nginxZones.map((zone) => (
                      <div key={zone.id} className="bg-neutral-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group border-t-4 border-t-indigo-500">
                         
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <div className="text-xs text-indigo-400 font-bold tracking-widest uppercase mb-1 flex items-center gap-1"><Layers className="w-3 h-3"/> Virtual Host</div>
                               <div className="text-2xl font-mono text-white flex items-center gap-2">
                                  {zone.ssl_enabled ? "https://" : "http://"}{zone.domain}
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => handleNginxDeploy(zone.id)}
                                 className="bg-indigo-600/20 hover:bg-indigo-500 hover:text-white text-indigo-400 border border-indigo-500/50 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer z-20 relative shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                                  <Terminal className="w-4 h-4"/> {t('nz.refresh_edge')}
                               </button>
                               <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 relative z-20">
                                  <button onClick={() => openNginxZoneModal(zone)} className="text-neutral-500 hover:text-indigo-400 bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-lg transition-colors"><Settings className="w-4 h-4"/></button>
                                  <button type="button" onClick={(e) => deleteNginxEntity(e, 'zone', zone.id)} className="text-neutral-500 hover:text-red-400 bg-neutral-800/50 hover:bg-neutral-800 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                               </div>
                            </div>
                         </div>
                         
                         <div className="mb-4">
                            {zone.eips && zone.eips.length > 0 ? (
                                <div className="text-xs text-neutral-400 flex items-center gap-2">
                                    <span className="bg-sky-500/20 text-sky-400 px-2 py-1 rounded">{t('nz.eip_expose')}</span>
                                    {zone.eips.map((eip) => <span key={eip.id} className="font-mono text-sky-300">{eip.ip_address}</span>)}
                                </div>
                            ) : (
                                <div className="text-xs text-neutral-600 italic mt-1">{t('nz.no_eip')}</div>
                            )}
                         </div>

                         <div className="space-y-2 bg-black/30 p-3 rounded-lg border border-neutral-800">
                            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2 font-bold flex justify-between">
                               <span>{t('nz.upstreams')}</span>
                               <span className="text-indigo-400 bg-indigo-500/10 px-1 rounded">{t('nz.nodes', {count: zone.upstreams?.length || 0})}</span>
                            </div>
                            {(zone.upstreams ?? []).length > 0 ? (zone.upstreams ?? []).map((us) => (
                               <div key={us.id} className="flex justify-between items-center text-sm font-mono border-b border-neutral-800/80 pb-1 last:border-0 last:pb-0">
                                  <span className="text-emerald-400">{us.ip_address}:{us.port}</span>
                                  <span className="text-neutral-500 text-xs">wt: <span className="text-neutral-300">{us.weight}</span></span>
                               </div>
                            )) : (
                               <div className="text-xs text-neutral-600 italic py-1">{t('nz.wait_backend')}</div>
                            )}
                         </div>
                      </div>
                   ))}
                 </div>
             )}
             <div onClick={() => openNginxZoneModal()} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-indigo-900/50 hover:border-indigo-500/50 hover:bg-indigo-900/10 rounded-2xl p-6 transition-all min-h-[140px] text-neutral-500 hover:text-indigo-400 cursor-pointer mt-4">
                <div className="bg-neutral-900 text-indigo-500 rounded-full p-2 mb-1"><Plus className="w-5 h-5" /></div>
                <span className="font-bold text-sm tracking-wide">构筑全新代理隔离域网关</span>
             </div>
          </div>
        </section>
      )}

      {/* Nginx 七层大盘应用分发: 应用服务真实节点 (Upstreams) */}
      {activeTab === "nginx_upstreams" && !loading && (() => {
        const enrichedUpstreams = nginxUpstreams.map(us => {
             const z = nginxZones.find(z => z.id === us.zone_id);
             return { ...us, attached_zone_domain: z ? z.domain : 'Unassigned' };
        });
        return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-fuchsia-400">
            <HardDrive className="w-5 h-5 text-fuchsia-400" />
            {t('nu.title')}
          </h2>
          <div className="flex flex-col gap-6">
             {enrichedUpstreams.length === 0 ? (
                 <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                    <Database className="w-10 h-10 mb-4 opacity-50 text-fuchsia-400" />
                    <p>{t('nu.no_upstreams')}</p>
                 </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                   {enrichedUpstreams.map((us, idx) => (
                      <div key={us.id || idx} className="bg-neutral-900 border border-fuchsia-500/20 rounded-xl p-4 flex flex-col gap-3 transition-colors hover:bg-neutral-800/80 group">
                         <div className="flex justify-between items-start">
                           <h3 className="text-fuchsia-400 font-bold flex items-center gap-2 text-lg font-mono">
                              <Activity className="w-4 h-4 opacity-70"/> {us.ip_address}:{us.port}
                           </h3>
                           <div className="flex bg-neutral-950 rounded border border-neutral-800 overflow-hidden">
                              <button onClick={() => openNginxUpstreamModal(us)} className="text-neutral-500 hover:text-fuchsia-400 px-2 py-1 hover:bg-neutral-800 transition-colors"><Settings className="w-3 h-3"/></button>
                              <button type="button" onClick={(e) => deleteNginxEntity(e, 'upstream', us.id)} className="text-neutral-500 hover:text-red-400 px-2 py-1 hover:bg-neutral-800 transition-colors border-l border-neutral-800"><Trash2 className="w-3 h-3"/></button>
                           </div>
                         </div>
                         <div className="text-sm font-bold text-neutral-400 bg-neutral-950 px-3 py-2 rounded flex justify-between border border-neutral-800">
                            <span>{t('nu.weight')}</span>
                            <span className="text-white">{us.weight}X</span>
                         </div>
                         <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-2">
                            <span>{t('nu.attached_zone')}</span>
                            <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-1.5 py-0.5 rounded-sm">{us.attached_zone_domain}</span>
                         </div>
                      </div>
                   ))}
                </div>
             )}
             <div onClick={() => openNginxUpstreamModal()} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-fuchsia-900/50 hover:border-fuchsia-500/50 hover:bg-fuchsia-900/10 rounded-2xl p-6 transition-all min-h-[140px] text-neutral-500 hover:text-fuchsia-400 cursor-pointer mt-4">
                <div className="bg-neutral-900 text-fuchsia-500 rounded-full p-2 mb-1"><Plus className="w-5 h-5" /></div>
                <span className="font-bold text-sm tracking-wide">{t('nu.add')}</span>
             </div>
          </div>
        </section>
        )
      })()}

      {/* RS 底层计算资源的呈现 */}
      {activeTab === "servers" && !loading && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-neutral-200">
            <HardDrive className="w-5 h-5 text-amber-400" />
            {t('rs.title')}
          </h2>
          <div className="flex flex-col gap-6">
            {servers.length === 0 ? (
                 <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                    <Database className="w-10 h-10 mb-4 opacity-50" />
                    <p>{t('rs.no_servers')}</p>
                 </div>
            ) : (
                (() => {
                    const groupedServers = servers.reduce<Record<string, ServerNode[]>>((acc, srv) => {
                       const key = `${t('rs.listen_port')} ${srv.port}`;
                       if (!acc[key]) acc[key] = [];
                       acc[key].push(srv);
                       return acc;
                    }, {});

                    return Object.entries(groupedServers).map(([portName, srvs]) => (
                       <details key={portName} open className="col-span-full border border-amber-900/50 rounded-xl overflow-hidden mb-2 group/port">
                          <summary className="bg-amber-950/40 p-4 font-bold text-amber-400 flex items-center gap-2 cursor-pointer outline-none hover:bg-amber-900/30 border-b border-amber-900/50">
                             <Database className="w-5 h-5 text-amber-500" /> {t('rs.pool')} {portName}
                          </summary>
                          <div className="p-4 grid grid-cols-1 xl:grid-cols-2 lg:grid-cols-3 gap-4 bg-black/20">
                             {(srvs as any[]).map((srv) => (
                                 <div key={srv.id} className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-6 flex flex-col gap-3 transition-colors hover:bg-amber-900/30">
                                    <div className="flex justify-between items-start">
                                      <h3 className="text-amber-400 font-bold flex items-center gap-2 text-xl">
                                         <HardDrive className="w-5 h-5 opacity-70"/> {srv.serverName}
                                      </h3>
                                      <div className="flex items-center gap-2">
                                         <div className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded shadow-[0_0_8px_rgba(245,158,11,0.2)]">{srv.status}</div>
                                         <button onClick={() => openServerModal(srv as any)} className="text-neutral-500 hover:text-amber-400 p-1 rounded-md transition-colors"><Settings className="w-4 h-4"/></button>
                                      </div>
                                    </div>
                                    <p className="text-neutral-400 text-sm font-mono flex items-center gap-2"><Activity className="w-3 h-3 text-neutral-500"/> {srv.serverIp}</p>
                                    {(srv as any).vips?.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-amber-900/30 text-xs text-neutral-500 flex flex-wrap gap-2 items-center">
                                           <span className="text-amber-600 font-bold flex items-center gap-1"><Layers className="w-3 h-3"/> 已绑定 VIP:</span>
                                           {(srv as any).vips.map((v: any) => (
                                              <span key={v.id} className="text-cyan-500 border border-cyan-900/50 px-1.5 py-0.5 rounded-sm bg-neutral-900">VIP-{v.vipAddress ?? v.virtual_ipaddress ?? v.vip_address}</span>
                                           ))}
                                        </div>
                                    )}
                                 </div>
                             ))}
                          </div>
                       </details>
                    ));
                })()
            )}
            
            {/* RS 新建卡片骨架 */}
            <div onClick={() => openServerModal()} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-amber-900/50 rounded-2xl p-6 text-neutral-500 hover:text-amber-400 hover:bg-amber-900/10 hover:border-amber-500/50 transition-all cursor-pointer min-h-[140px] mt-4">
              <div className="bg-neutral-900 rounded-full p-3 mb-2 group-hover:bg-amber-900/40 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium text-sm transition-colors">{t('rs.add')}</span>
            </div>
          </div>
        </section>
      )}

      {/* 自动化配置 (Ansible) 聚合大盘 */}
      {activeTab === "ansible_console" && !loading && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-20 flex flex-col xl:flex-row gap-6 items-start">
           
           {/* 左侧：操作卡片区 */}
           <div className="flex-1 w-full space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-red-400 bg-red-950/20 w-fit px-4 py-2 rounded-xl border border-red-900/30">
                <Terminal className="w-5 h-5" />
                {t('ansi.title')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* LVS Playbook */}
                 <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-6 transition-all hover:border-red-500/30 group">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="bg-red-500/10 p-3 rounded-xl"><Layers className="w-6 h-6 text-red-500"/></div>
                       <div>
                          <h3 className="font-bold text-white tracking-wide">{t('ansi.lvs_title')}</h3>
                          <p className="text-xs text-neutral-500">lvs_deploy.yml</p>
                       </div>
                    </div>
                    <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{t('ansi.lvs_desc')}</p>
                    <div className="flex flex-col gap-3">
                       <select value={lvsDeployScope} onChange={e => setLvsDeployScope(e.target.value)} className="bg-black/50 border border-neutral-700 text-neutral-300 text-sm rounded-lg p-2 outline-none focus:border-red-500/50">
                          <option value="global">{t('ansi.scope_global')}</option>
                          <optgroup label={t('ansi.scope_dc')}>
                             {Array.from(new Set(servers.map(s => s.datacenter).filter(Boolean))).map(dc => (
                                <option key={`dc-${dc}`} value={`dc:${dc}`}>Zone: {dc}</option>
                             ))}
                          </optgroup>
                          <optgroup label={t('ansi.scope_pod')}>
                             {Array.from(new Set(servers.map(s => s.cabinet).filter(Boolean))).map(cab => (
                                <option key={`cab-${cab}`} value={`cab:${cab}`}>Pod: {cab}</option>
                             ))}
                          </optgroup>
                       </select>
                       <button 
                          onClick={() => {
                             if(!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string)) return;
                             openDeployAuth("lvs", lvsDeployScope);
                          }} 
                          disabled={!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string)}
                          className={`w-full font-bold py-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-red-600/20 hover:bg-red-500 text-red-400 hover:text-white border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.1)]'}`}
                       >
                          <Terminal className="w-4 h-4" /> 
                          {!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? t('vips.no_auth') : t('ansi.eval_btn')}
                       </button>
                    </div>
                 </div>
                 
                 {/* Nginx Playbook */}
                 <div className="border border-neutral-800 bg-neutral-900/60 rounded-2xl p-6 transition-all hover:border-indigo-500/30 group">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="bg-indigo-500/10 p-3 rounded-xl"><Globe className="w-6 h-6 text-indigo-500"/></div>
                       <div>
                          <h3 className="font-bold text-white tracking-wide">{t('ansi.nginx_title')}</h3>
                          <p className="text-xs text-neutral-500">nginx_edge_sync.yml</p>
                       </div>
                    </div>
                    <p className="text-sm text-neutral-400 mb-4 line-clamp-2">{t('ansi.nginx_desc')}</p>
                    <div className="flex flex-col gap-3">
                       <select value={nginxDeployScope} onChange={e => setNginxDeployScope(e.target.value)} className="bg-black/50 border border-neutral-700 text-neutral-300 text-sm rounded-lg p-2 outline-none focus:border-indigo-500/50">
                          <option value="global">{t('ansi.scope_global')}</option>
                          <optgroup label={t('ansi.scope_dc')}>
                             {Array.from(new Set(servers.map(s => s.datacenter).filter(Boolean))).map(dc => (
                                <option key={`dc-${dc}`} value={`dc:${dc}`}>Zone: {dc}</option>
                             ))}
                          </optgroup>
                          <optgroup label={t('ansi.scope_pod')}>
                             {Array.from(new Set(servers.map(s => s.cabinet).filter(Boolean))).map(cab => (
                                <option key={`cab-${cab}`} value={`cab:${cab}`}>Pod: {cab}</option>
                             ))}
                          </optgroup>
                       </select>
                       <button 
                          onClick={() => {
                             if(!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string)) return;
                             openDeployAuth("nginx", nginxDeployScope);
                          }} 
                          disabled={!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string)}
                          className={`w-full font-bold py-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? 'bg-neutral-900 border-neutral-800 text-neutral-600 cursor-not-allowed' : 'bg-indigo-600/20 hover:bg-indigo-500 text-indigo-400 hover:text-white border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]'}`}
                       >
                          <Activity className="w-4 h-4" /> 
                          {!['SUPER_ADMIN', 'NETWORK_ADMIN', 'OPS'].includes(currentUser?.role as string) ? t('vips.no_auth') : t('ansi.eval_btn')}
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* 右侧：实时主机库 Inventory */}
           <div className="w-full xl:w-96 flex flex-col gap-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                 <h2 className="text-sm font-extrabold text-neutral-400 flex items-center gap-2 uppercase tracking-widest">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Dynamic Inventory
                 </h2>
                 <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">Live</span>
              </div>
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 overflow-x-auto min-h-[300px] shadow-inner relative">
                 <button className="absolute top-3 right-3 text-neutral-500 hover:text-white bg-neutral-900 p-1.5 rounded-lg border border-neutral-700 transition-colors" title="Copy Inventory">
                    <span className="text-xs font-mono font-bold">Copy</span>
                 </button>
                 <pre className="text-[11px] md:text-xs text-neutral-400 font-mono leading-relaxed mt-2 whitespace-pre-wrap">
                    {generateAnsibleInventory()}
                 </pre>
              </div>
           </div>
        </section>
      )}
      
            {/* 成员权限管控 (RBAC) 升级版 */}
      {activeTab === "rbac_users" && currentUser?.role === "SUPER_ADMIN" && (
         <section className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b border-amber-900/50 pb-4 gap-4">
               <h2 className="text-2xl font-bold flex items-center gap-3 text-amber-500 shadow-amber-500 text-shadow">
                  <ShieldAlert className="w-6 h-6" /> {t('rbac.title')}
               </h2>
               <div className="flex bg-black/40 border border-amber-900/40 rounded-xl p-1 gap-1">
                  <button onClick={() => setRbacSubTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${rbacSubTab === 'users' ? 'bg-amber-600/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] border border-amber-500/30' : 'text-neutral-500 hover:text-amber-400'}`}>{t('rbac.users')}</button>
                  <button onClick={() => setRbacSubTab('groups')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${rbacSubTab === 'groups' ? 'bg-amber-600/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] border border-amber-500/30' : 'text-neutral-500 hover:text-amber-400'}`}>{t('rbac.groups')}</button>
                  <button onClick={() => setRbacSubTab('roles')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${rbacSubTab === 'roles' ? 'bg-amber-600/20 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] border border-amber-500/30' : 'text-neutral-500 hover:text-amber-400'}`}>{t('rbac.roles')}</button>
               </div>
            </div>

            {rbacSubTab === "users" && (
              <>
                <div className="flex justify-end mb-6">
                   <button onClick={() => {
                      setUserFormData({id: 0, username: "", password: "", role: "VIEWER", groups: []});
                      setIsUserModalOpen(true);
                   }} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all">
                      <Plus className="w-4 h-4"/> {t('rbac.add_user')}
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {rbacUsers.map((u: any) => (
                      <div key={u.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative group overflow-hidden ${u.role === 'ARCHIVED' ? 'opacity-50 saturate-0 scale-[0.98]' : ''}`}>
                         <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${u.role === 'ARCHIVED' ? 'bg-red-900 text-red-300' : u.role === 'SUPER_ADMIN' ? 'bg-amber-500 text-black' : ['OPS','NETWORK_ADMIN'].includes(u.role) ? 'bg-sky-500 text-black' : 'bg-neutral-700 text-white'}`}>
                            {u.role === 'ARCHIVED' ? t('rbac.archived') : u.role}
                         </div>
                         <div className="absolute top-8 right-3 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2 z-10">
                             <button onClick={() => { setUserFormData({ id: u.id, username: u.username, password: "", role: u.role || "VIEWER", groups: (u.groups || []).map((g:any) => g.id) }); setIsUserModalOpen(true); }} className="p-1.5 bg-neutral-800 text-neutral-400 rounded-lg hover:bg-neutral-700 hover:text-amber-400"><Settings className="w-4 h-4"/></button>
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTimeout(() => handleDeleteUser(u.id), 50); }} disabled={u.username === currentUser?.username || u.username === 'admin'} className={`bg-red-950/50 text-red-500 p-1.5 rounded-lg border border-red-900/50 hover:bg-red-900/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`} title={u.role === "ARCHIVED" ? t('rbac.archived') : t('rbac.archived')}>
                                <Archive className="w-4 h-4"/>
                             </button>
                         </div>
                         <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${u.role === 'SUPER_ADMIN' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : ['OPS','NETWORK_ADMIN'].includes(u.role) ? 'bg-sky-500/20 text-sky-500 border border-sky-500/30' : 'bg-neutral-800 text-neutral-400 border border-neutral-700'}`}>
                               {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                               <h3 className="font-bold text-lg text-white">{u.username}</h3>
                               <p className="text-xs text-neutral-500 font-mono">Token ID: {u.id}</p>
                            </div>
                         </div>
                         
                         <div className="flex flex-col gap-2 mt-4 text-xs">
                             {(u.groups?.length > 0 || u.roles?.length > 0) ? (
                                <div className="p-2 border border-dashed border-amber-900/30 bg-amber-950/20 rounded">
                                  {u.groups?.map((g: any) => <span key={g.id} className="inline-block bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded mr-1">[{g.name}]</span>)}
                                  {u.roles?.map((r: any) => <span key={r.id} className="inline-block bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded mr-1">{r.name}</span>)}
                                </div>
                             ) : (
                                <div className="text-neutral-600 italic">{t('rbac.no_groups')}</div>
                             )}
                         </div>
                         
                         <div className="mt-4">
                            <select
                               value={u.role}
                               onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                               disabled={u.username === 'admin'}
                               className={`w-full bg-black/50 border border-neutral-700 text-neutral-300 rounded-lg px-2 py-1.5 text-xs outline-none ${u.username === 'admin' ? 'opacity-50 cursor-not-allowed' : 'focus:border-amber-500/50'}`}
                            >
                               {rbacRoles.length > 0 ? (
                                  rbacRoles.map((r: any) => (
                                     <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                                  ))
                               ) : (
                                  <>
                                     <option value="VIEWER">{t('rbac.viewer')}</option>
                                     <option value="ARCHIVED" className="bg-red-900/20 text-red-400">{t('rbac.archived')}</option>
                                  </>
                               )}
                            </select>
                         </div>
                      </div>
                   ))}
                </div>
              </>
            )}

            {rbacSubTab === "groups" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {rbacGroups.length === 0 ? (
                      <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                         <Building className="w-10 h-10 mb-4 opacity-50 text-indigo-400" />
                         <p>{t('rbac.no_groups_data')}</p>
                      </div>
                   ) : rbacGroups.map((g: any) => (
                      <div key={g.id} className={`bg-neutral-900 border border-indigo-900/40 rounded-2xl p-6 transition-all hover:bg-neutral-800/60 relative group ${g.name.startsWith("[ARCHIVED]") ? "opacity-50 saturate-0 scale-[0.98]" : ""}`}>
                         <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                             <button onClick={() => { setGroupFormData({ id: g.id, name: g.name, description: g.description || "", roles: (g.roles || []).map((r:any) => r.id) }); setIsGroupModalOpen(true); }} className="p-1.5 bg-indigo-900/40 text-indigo-400 rounded-lg hover:bg-indigo-900/80"><Settings className="w-4 h-4"/></button>
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTimeout(() => handleArchiveGroup(g), 50); }} className="p-1.5 bg-red-900/40 text-red-500 rounded-lg hover:bg-red-900/80" title={t('rbac.archive_group')}>
                                 <Archive className="w-4 h-4"/>
                             </button>
                         </div>
                         <h3 className="font-bold text-lg text-indigo-400 mb-1 pr-12">{g.name}</h3>
                         <p className="text-xs text-neutral-500 mb-4">{g.description || t('rbac.no_desc')}</p>
                         <div className="text-xs space-y-2 border-t border-indigo-900/30 pt-4">
                            <div className="flex items-start gap-2 flex-col"><span className="text-neutral-400">{t('rbac.related_roles')}</span> <div className="flex flex-wrap gap-1.5">{g.roles?.map((r: any) => <span key={r.id} className="bg-emerald-900/50 text-emerald-400 px-2 rounded">{r.name}</span>) || "-"}</div></div>
                         </div>
                      </div>
                   ))}
                   <div onClick={() => { setGroupFormData({ id: 0, name: '', description: '', roles: [] }); setIsGroupModalOpen(true); }} className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-2xl p-6 transition-all min-h-[160px] border-indigo-900/50 text-indigo-500 hover:text-indigo-400 hover:bg-indigo-900/10 cursor-pointer">
                      <div className="rounded-full p-3 bg-neutral-900"><Plus className="w-6 h-6" /></div>
                      <span className="font-medium text-sm">{t('rbac.add_group')}</span>
                   </div>
                </div>
            )}

            {rbacSubTab === "roles" && (
                <div className="flex flex-col gap-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {rbacRoles.length === 0 ? (
                         <div className="col-span-full py-10 text-center flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30 text-neutral-500">
                            <Layers className="w-10 h-10 mb-4 opacity-50 text-emerald-400" />
                            <p>{t('rbac.no_roles')}</p>
                         </div>
                      ) : rbacRoles.map((r: any) => (
                         <div key={r.id} className={`bg-neutral-900 border border-emerald-900/40 rounded-2xl p-6 transition-all hover:bg-neutral-800/60 relative group ${r.name.startsWith("[ARCHIVED]") ? "opacity-50 saturate-0 scale-[0.98]" : ""}`}>
                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <button onClick={() => { setRoleFormData({ id: r.id, name: r.name, code: r.code, description: r.description || "", permissions: (r.permissions || []).map((p:any) => p.id) }); setIsRoleModalOpen(true); }} className="p-1.5 bg-emerald-900/40 text-emerald-400 rounded-lg hover:bg-emerald-900/80"><Settings className="w-4 h-4"/></button>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTimeout(() => handleArchiveRole(r), 50); }} className="p-1.5 bg-red-900/40 text-red-500 rounded-lg hover:bg-red-900/80" title={t('rbac.archive_role')}>
                                 <Archive className="w-4 h-4"/>
                             </button>
                            </div>
                            <div className="flex flex-col pr-12 mb-1">
                               <h3 className="font-bold text-lg text-emerald-400">{r.name}</h3>
                               <span className="text-[10px] text-neutral-500 font-mono w-fit">{r.code}</span>
                            </div>
                            <p className="text-xs text-neutral-500 mb-4 h-8 mt-2">{r.description}</p>
                            <div className="text-xs space-y-2 border-t border-neutral-800 pt-4">
                               <div className="flex flex-wrap gap-1.5">
                                  {r.permissions?.length > 0 ? r.permissions.map((p: any) => (
                                      <span key={p.id} className="bg-sky-900/30 border border-sky-900/50 text-sky-400 px-2 py-0.5 rounded-sm font-mono" title={p.description}>{p.resource_name}</span>
                                  )) : <span className="text-neutral-600 italic">{t('rbac.no_perms')}</span>}
                               </div>
                            </div>
                         </div>
                      ))}
                      <div onClick={() => { setRoleFormData({ id: 0, name: '', code: '', description: '', permissions: [] }); setIsRoleModalOpen(true); }} className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-2xl p-6 transition-all min-h-[160px] border-emerald-900/50 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/10 cursor-pointer">
                         <div className="rounded-full p-3 bg-neutral-900"><Plus className="w-6 h-6" /></div>
                         <span className="font-medium text-sm">{t('rbac.add_role')}</span>
                      </div>
                   </div>

                   <details className="mt-8">
                       <summary className="text-sm font-bold text-neutral-500 cursor-pointer hover:text-neutral-300">{t('rbac.expand_perms')}</summary>
                       <div className="mt-4 flex flex-wrap gap-2 p-4 bg-black/50 border border-neutral-800 rounded-xl">
                          {rbacPermissions.length === 0 ? <span className="text-xs text-neutral-600">{t('rbac.no_system_perms')}</span> : rbacPermissions.map((p: any) => (
                             <span key={p.id} className="text-xs border border-neutral-700 bg-neutral-900 text-neutral-300 px-2 py-1 rounded" title={p.description}>
                                {p.resource_name}
                             </span>
                          ))}
                       </div>
                   </details>
                </div>
            )}
         </section>
      )}

      {/* ================= 极客运维指挥模态舱群 (Modal Group) ================= */}

      
      {/* RBAC 业务组群模态舱 */}
      {isGroupModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-neutral-900 border border-indigo-900/50 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl shadow-indigo-900/10">
               <div className="bg-indigo-950/30 border-b border-indigo-900/50 p-4 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-indigo-500 flex items-center gap-2">
                     <Building className="w-5 h-5"/> {groupFormData.id ? "编辑分组配置" : "新建分组"}
                  </h3>
                  <button onClick={() => setIsGroupModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleAddGroup} className="p-6">
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.group_name')}</label>
                        <input required type="text" value={groupFormData.name} onChange={(e)=>setGroupFormData({...groupFormData, name: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500/50 transition-colors"/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.description')}</label>
                        <input type="text" value={groupFormData.description} onChange={(e)=>setGroupFormData({...groupFormData, description: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-indigo-500/50 transition-colors"/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">{t('form.bind_roles')}</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-neutral-950 rounded-lg max-h-48 overflow-auto border border-neutral-800">
                           {rbacRoles.map((r: any) => (
                              <label key={r.id} className="flex items-center gap-2 w-full text-sm text-neutral-300 hover:text-indigo-400 cursor-pointer p-1 rounded hover:bg-neutral-900">
                                 <input type="checkbox" checked={groupFormData.roles.includes(r.id)} onChange={(e) => {
                                     const set = new Set(groupFormData.roles);
                                     if(e.target.checked) set.add(r.id); else set.delete(r.id);
                                     setGroupFormData({...groupFormData, roles: Array.from(set)});
                                 }} className="accent-indigo-500"/>
                                 <span>{r.name} <span className="text-xs text-neutral-500">({r.code})</span></span>
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors">取消</button>
                     <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all">
                        {submitting ? "保存中..." : (groupFormData.id ? "保存网络群" : "保存群组")}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* RBAC 新角色策略包模态舱 */}
      {isRoleModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-neutral-900 border border-emerald-900/50 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl shadow-emerald-900/10">
               <div className="bg-emerald-950/30 border-b border-emerald-900/50 p-4 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
                     <Layers className="w-5 h-5"/> {roleFormData.id ? "编辑角色配置" : "新建角色"}
                  </h3>
                  <button onClick={() => setIsRoleModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleAddRole} className="p-6">
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.role_name')}</label>
                           <input required type="text" placeholder="e.g., Advanced Auditor" value={roleFormData.name} onChange={(e)=>setRoleFormData({...roleFormData, name: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors"/>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.role_code')}</label>
                           <input required type="text" placeholder="e.g., ADV_AUD" value={roleFormData.code} onChange={(e)=>setRoleFormData({...roleFormData, code: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors uppercase"/>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.description')}</label>
                        <input type="text" value={roleFormData.description} onChange={(e)=>setRoleFormData({...roleFormData, description: e.target.value})} className="w-full bg-black/50 border border-neutral-700 text-white rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-500/50 transition-colors"/>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">{t('form.bind_perms')}</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-neutral-950 rounded-lg max-h-48 overflow-auto border border-neutral-800">
                           {rbacPermissions.map((p: any) => (
                              <label key={p.id} className="flex items-center gap-2 w-full text-sm text-neutral-300 hover:text-emerald-400 cursor-pointer p-1 rounded hover:bg-neutral-900">
                                 <input type="checkbox" checked={roleFormData.permissions.includes(p.id)} onChange={(e) => {
                                     const set = new Set(roleFormData.permissions);
                                     if(e.target.checked) set.add(p.id); else set.delete(p.id);
                                     setRoleFormData({...roleFormData, permissions: Array.from(set)});
                                 }} className="accent-emerald-500"/>
                                 <span>{p.resource_name}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors">取消</button>
                     <button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                        {submitting ? "保存中..." : (roleFormData.id ? "保存角色" : "创建角色")}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* RBAC 用户管理模态舱 */}
      {isUserModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl shadow-amber-900/10">
               <div className="bg-amber-950/30 border-b border-amber-900/50 p-4 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                     <ShieldAlert className="w-5 h-5"/> {userFormData.id ? t('modal.user_edit') : t('modal.user_create')}
                  </h3>
                  <button onClick={() => setIsUserModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
               </div>
               <form onSubmit={handleAddUser} className="p-6">
                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.username')}</label>
                        <input required type="text" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-neutral-200 outline-none focus:border-amber-500 flex-1" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.password')}</label>
                        <input required type="password" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2 text-neutral-200 outline-none focus:border-amber-500 flex-1" />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{t('form.sys_role')}</label>
                        <select required value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})} className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-neutral-200 outline-none focus:border-amber-500">
                           {rbacRoles.length > 0 ? (
                                rbacRoles.map((r: any) => (
                                   <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                                ))
                             ) : (
                                <>
                                   <option value="VIEWER">[Lv.1] VIEWER - 基础只读权</option>
                                </>
                             )}
                        </select>
                     </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-3 rounded-xl mt-6 transition-colors disabled:opacity-50">
                     {submitting ? '签发中...' : '创建用户'}
                  </button>
               </form>
            </div>
         </div>
      )}

      {/* 极危权限评估预案 (Auth Strategy Prompt) */}
      {deployAuthModal.isOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#0a0a0a] border border-red-500/50 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl shadow-red-900/20">
            <div className="bg-red-950/30 border-b border-red-900/50 p-4 flex justify-between items-center">
               <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                 <Terminal className="w-5 h-5 animate-pulse"/> 高风险操作确认 (Blast Radius Review)
               </h3>
               <button onClick={() => setDeployAuthModal({isOpen: false, type: "", scope: "global"})} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 flex flex-col gap-5">
               <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-red-500 mb-2 border-b border-red-900/30 pb-2">即将执行: {deployAuthModal.type === 'lvs' ? 'LVS 配置重载' : 'Nginx 配置下发'}</h4>
                  <div className="text-xs text-neutral-400 space-y-3 mt-3">
                     <p className="flex justify-between items-center"><span>影响范围 (Target Scope):</span> <span className="text-white font-mono font-bold bg-neutral-900 p-1.5 px-3 rounded border border-neutral-700">{deployAuthModal.scope.toUpperCase()}</span></p>
                     
                     {deployAuthModal.scope === "global" ? (
                        <>
                           <p className="flex justify-between items-center"><span className="text-red-300">发布策略 (Enforced Strategy):</span> <span className="text-red-100 font-bold border-2 border-red-500 bg-red-950/80 px-2 py-1 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse">ROLLING UPDATE (分批滚动)</span></p>
                           <p className="flex items-start text-xs text-red-200 mt-2 bg-red-950/50 p-3 rounded-lg border border-red-900/50 leading-relaxed shadow-inner">
                             <Activity className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-red-500"/>
                             检测到全局范围发布。系统将自动分批执行，并在批次间进行健康检查，降低故障扩散风险。
                           </p>
                        </>
                     ) : (
                        <p className="flex justify-between items-center"><span className="text-amber-300">发布策略 (Strategy):</span> <span className="text-amber-400 font-bold bg-amber-900/20 border border-amber-500/30 px-2 py-1 rounded">快速并发 (Fast Concurrency)</span></p>
                     )}
                  </div>
               </div>

               <div className="mt-2">
                 <label className="text-sm font-bold text-neutral-300 mb-2 flex items-center justify-between">
                    <span>二次确认 (Input Required)</span>
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase border border-red-500/20">此操作不可逆</span>
                 </label>
                 <div className="text-xs text-neutral-400 mb-3 leading-relaxed">
                   请输入下方确认短语以继续执行：
                   <div className="text-red-400 font-bold font-mono tracking-[0.2em] block text-center bg-black py-3 mt-2 border border-red-900 rounded select-none shadow-inner text-base">CONFIRM-PROD</div>
                 </div>
                 <input 
                    type="text" 
                    value={deployAuthInput}
                    onChange={(e) => setDeployAuthInput(e.target.value)}
                    placeholder="Type the exact text above..." 
                    className="w-full bg-black border-2 border-neutral-800 text-red-400 text-center font-mono font-bold rounded-xl p-4 outline-none focus:border-red-500 transition-colors placeholder:text-neutral-700 placeholder:font-sans placeholder:tracking-normal" 
                 />
               </div>
               
               <button 
                  disabled={deployAuthInput !== "CONFIRM-PROD"}
                  onClick={() => handleAnsibleMockDeploy(deployAuthModal.type, deployAuthModal.scope)} 
                  className={`w-full py-4 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${deployAuthInput === "CONFIRM-PROD" ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-red-400" : "bg-neutral-900/50 text-neutral-600 cursor-not-allowed border border-neutral-800"}`}
               >
                  <Terminal className="w-5 h-5"/> 确认执行 (Execute Procedure)
               </button>
            </div>
          </div>
        </div>
      )}
      {/* 1. 基础设施创建弹窗 (Infra Modal) */}
      {isInfraModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-950 border border-fuchsia-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl shadow-fuchsia-900/20">
            <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
               <h3 className="text-lg font-bold text-fuchsia-400 flex items-center gap-2">
                 <Building className="w-5 h-5"/> {infraModalType === 'full_chain' ? '新建完整基础设施 (Full Chain)' : infraModalType === 'room' ? '新增机房 (Room)' : infraModalType === 'cabinet' ? '新增机柜 (Rack)' : '新建基础设施 (Infra)'}
               </h3>
               <button onClick={() => setIsInfraModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 flex flex-col gap-4">
               {(infraModalType === "full_chain" || infraModalType === "datacenter") && (
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="text-xs font-bold text-neutral-400 mb-1 block">{t('form.infra_region')}</label>
                     <input type="text" value={infraFormData.name} onChange={e => setInfraFormData({...infraFormData, name: e.target.value, code: getCodeForName(e.target.value)})} className="w-full bg-black border border-neutral-800 rounded p-2 text-fuchsia-100 placeholder-neutral-700 focus:border-fuchsia-500 outline-none" placeholder="e.g., Shanghai" />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs font-bold text-neutral-400 mb-1 block">{t('form.infra_region_code')} <span className="text-neutral-600 font-normal">{t('form.infra_auto_completion')}</span></label>
                     <input type="text" value={infraFormData.code} onChange={e => setInfraFormData({...infraFormData, code: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-fuchsia-400 font-mono placeholder-neutral-700 focus:border-fuchsia-500 outline-none" placeholder="e.g., SH" />
                   </div>
                 </div>
               )}
               {(infraModalType === "full_chain" || infraModalType === "room") && (
                 <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="text-xs font-bold text-neutral-400 mb-1 block">{t('form.infra_room')}</label>
                     <input type="text" value={infraFormData.room_name} onChange={e => setInfraFormData({...infraFormData, room_name: e.target.value, room_code: getCodeForName(e.target.value)})} className="w-full bg-black border border-neutral-800 rounded p-2 text-fuchsia-100 placeholder-neutral-700 focus:border-fuchsia-500 outline-none" placeholder="e.g., Core_DC" />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs font-bold text-neutral-400 mb-1 block">{t('form.infra_room_code')}</label>
                     <input type="text" value={infraFormData.room_code} onChange={e => setInfraFormData({...infraFormData, room_code: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-fuchsia-400 font-mono placeholder-neutral-700 focus:border-fuchsia-500 outline-none" placeholder="e.g., CORE" />
                   </div>
                 </div>
               )}
               {(infraModalType === "full_chain" || infraModalType === "cabinet") && (
                 <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800/50 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                       <label className="text-xs font-bold text-neutral-400">{t('form.infra_cab')}</label>
                       <button type="button" onClick={() => setInfraFormData({...infraFormData, cabinets: [...infraFormData.cabinets, { name: "", code: "" }]})} className="text-fuchsia-400 text-xs font-bold bg-fuchsia-900/20 px-2 py-1 rounded hover:bg-fuchsia-900/50">+ 扩充阵列</button>
                    </div>
                    {infraFormData.cabinets.map((cab, idx) => (
                        <div key={idx} className="flex gap-2 w-full">
                          <input required type="text" placeholder={t('form.infra_cab_loc')} value={cab.name} onChange={(e) => { const newCabs = [...infraFormData.cabinets]; newCabs[idx].name = e.target.value; newCabs[idx].code = getCodeForName(e.target.value); setInfraFormData({...infraFormData, cabinets: newCabs}); }} className="flex-1 bg-black border border-neutral-800 rounded p-2 text-fuchsia-100 placeholder-neutral-700 outline-none focus:border-fuchsia-500" />
                          <input required type="text" placeholder={t('form.infra_cab_code')} value={cab.code} onChange={(e) => { const newCabs = [...infraFormData.cabinets]; newCabs[idx].code = e.target.value.toUpperCase(); setInfraFormData({...infraFormData, cabinets: newCabs}); }} className="w-1/3 bg-black border border-neutral-800 rounded p-2 text-fuchsia-400 font-mono placeholder-neutral-700 outline-none focus:border-fuchsia-500" />
                          {infraFormData.cabinets.length > 1 && (
                              <button type="button" onClick={() => { const newCabs = [...infraFormData.cabinets]; newCabs.splice(idx, 1); setInfraFormData({...infraFormData, cabinets: newCabs}); }} className="p-2 text-red-500 hover:bg-red-950 rounded"><X className="w-4 h-4"/></button>
                          )}
                        </div>
                    ))}
                 </div>
               )}
               <button onClick={handleInfraSubmit} disabled={submitting} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold p-3 rounded-xl mt-2 transition-colors border border-fuchsia-400/30">
                  {submitting ? '开辟中...' : '确认创建'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* 极简微调单点修改 */}
      {editingSingleNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-amber-500/30 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/20">
             <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-500">单线热覆写 (Hot Override)</h3>
                <button onClick={() => setEditingSingleNode(null)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">{t('form.node_name')}</label>
                 <input type="text" value={singleNodeFormData.name} onChange={e => setSingleNodeFormData({...singleNodeFormData, name: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-white placeholder-neutral-700 focus:border-amber-500 outline-none" placeholder={t('form.node_name')} />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">{t('form.node_wip')}</label>
                 <input type="text" value={singleNodeFormData.wip} onChange={e => setSingleNodeFormData({...singleNodeFormData, wip: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-cyan-400 placeholder-neutral-700 focus:border-amber-500 outline-none font-mono" placeholder={t('form.node_wip')} />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">{t('form.node_lip')}</label>
                 <input type="text" value={singleNodeFormData.lip} onChange={e => setSingleNodeFormData({...singleNodeFormData, lip: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-emerald-400 placeholder-neutral-700 focus:border-amber-500 outline-none font-mono" placeholder={t('form.node_lip')} />
                 </div>
                 <button onClick={handleUpdateSingleNode} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold p-3 rounded-xl mt-2">
                    覆写单体逻辑
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* 高级 VRRP 强关联节点对编辑窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-indigo-500/30 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/20 my-8">
             <div className="bg-neutral-900 border-b border-neutral-800 p-5 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                  <Cpu className="w-6 h-6"/> {editingGroupIds ? "编辑主备调度器配置" : "创建 VRRP 主备对"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white bg-neutral-800 p-2 rounded-full"><X className="w-5 h-5"/></button>
             </div>
             
             <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-950/10 p-5 rounded-xl border border-indigo-900/30">
                   <div>
                      <label className="text-xs font-bold text-indigo-400 mb-1 block">{t('form.node_vrid')}</label>
                      <input type="number" min="1" max="255" value={formData.virtual_router_id} onChange={e => setFormData({...formData, virtual_router_id: parseInt(e.target.value, 10) || 1})} className="w-full bg-black border border-indigo-900/50 rounded p-3 text-indigo-300 outline-none" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-indigo-400 mb-1 block">{t('form.node_rid')}</label>
                      <input type="text" value={formData.router_id} onChange={e => setFormData({...formData, router_id: e.target.value})} className="w-full bg-black border border-indigo-900/50 rounded p-3 text-indigo-300 outline-none" />
                   </div>
                   <div className="col-span-full">
                      <label className="text-xs font-bold text-indigo-400 mb-1 block">{t('form.node_cab')}</label>
                      <select value={formData.infra_cabinet_id || ""} onChange={e => {
                           const cabId = e.target.value ? parseInt(e.target.value) : null;
                           setFormData(prev => {
                               const newState = { ...prev, infra_cabinet_id: cabId };
                               if (cabId) {
                                   let c_name = ""; let r_name = ""; let d_name = "";
                                   let c_code = ""; let r_code = ""; let d_code = "";
                                   for (const dc of infraData) {
                                       for (const room of (dc.rooms || [])) {
                                           for (const cab of (room.cabinets || [])) {
                                               if (cab.id === cabId) {
                                                   c_name = cab.name; r_name = room.name; d_name = dc.name;
                                                   d_code = dc.code || dc.name; r_code = room.code || room.name; c_code = cab.code || cab.name;
                                                   break;
                                                }
                                           }
                                       }
                                   }
                                   newState.datacenter = d_name;
                                   newState.cabinet = c_name;
                                   
                                   // 为了满足企业级命名规范：提取大写代号及数字
                                   const generateCode = (str: string) => {
                                       if (!str) return "X";
                                       // 如果已经是纯英文字符+数字等，转大写直接返回
                                       if (/^[a-zA-Z0-9_\-]+$/.test(str)) {
                                            return str.toUpperCase();
                                       }
                                       // 如果包含中文，尝试在没有外部拼音库的情况下进行基础清理并转码，此处我们预期系统已配有正确的英文代号并回退到原字符串大写
                                       return str.toUpperCase();
                                   };

                                   const partD = generateCode(d_code);
                                   const partR = generateCode(r_code);
                                   const partC = generateCode(c_code);
                                   const basePrefix = `${partD}-${partR}-${partC}`;

                                   // 基于现有服务器列表计算该物理机柜下的集群组序号，以避免同机柜多组 LVS 名称冲突
                                   const cabServers = servers.filter((s:any) => s.infra_cabinet_id === cabId);
                                   let sequence = 1;
                                   const existingSeq = cabServers
                                      .map(s => {
                                          const serverLabel = s.name || s.serverName || s.servername || "";
                                          const match = serverLabel.match(/(\d+)$/);
                                          return match ? parseInt(match[1], 10) : 0;
                                      })
                                      .filter(n => !isNaN(n) && n > 0);
                                   
                                   if (existingSeq.length > 0) {
                                       sequence = Math.max(...existingSeq) + 1;
                                   } else if (cabServers.length > 0) {
                                       // 如果没有提取到明确的后缀数字，但存在服务器，按 2台=1组 计算大致序号
                                       sequence = Math.floor(cabServers.length / 2) + 1;
                                   }
                                   const seqStr = sequence.toString().padStart(2, '0');

                                   newState.master_name = `${basePrefix}-MASTER${seqStr}`;
                                   newState.backup_name = `${basePrefix}-BKP${seqStr}`;
                               }
                               return newState;
                           });
                      }} className="w-full bg-black border border-indigo-900/50 rounded p-3 text-indigo-300 outline-none font-bold">
                          <option value="">-- 脱离物理绑定 (幽灵节点) --</option>
                          {infraData.flatMap(dc => (
                                 dc.rooms?.map((room: any) => (
                                     <optgroup key={`room-${room.id}`} label={`[${dc.name}] ${room.name}`}>
                                         {room.cabinets?.map((cab: any) => (
                                             <option key={cab.id} value={cab.id}>{cab.name}</option>
                                         ))}
                                     </optgroup>
                                 )) || []
                          ))}
                      </select>
                   </div>
                </div>

                {(() => {
                    let computedRoomId = null;
                    let computedCabId = formData.infra_cabinet_id;
                    if (computedCabId) {
                        for (const dc of infraData) {
                            for (const room of dc.rooms || []) {
                                if (room.cabinets?.some((c:any) => c.id === computedCabId)) {
                                    computedRoomId = room.id;
                                    break;
                                }
                            }
                            if (computedRoomId) break;
                        }
                    }
                    const availablePublicIps = eips.filter((e: any) => 
                        (!e.asset_type || e.asset_type === 'PUBLIC_EIP') && 
                        (!computedRoomId || !e.infra_room_id || e.infra_room_id === computedRoomId)
                    );
                    const availablePrivateIps = eips.filter((e: any) => 
                        (e.asset_type && e.asset_type !== 'PUBLIC_EIP') && 
                        (!computedRoomId || !e.infra_room_id || e.infra_room_id === computedRoomId)
                    );


                    return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="border border-emerald-900/30 rounded-xl p-5 bg-gradient-to-b from-emerald-950/20 to-transparent">
                              <h4 className="text-emerald-500 font-bold mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> MASTER 节点配置</h4>
                              <div className="space-y-4">
                                 <div><label className="text-xs text-neutral-500">调度器名称</label><input type="text" value={formData.master_name} onChange={e=>setFormData({...formData, master_name: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-white outline-none focus:border-emerald-500"/></div>
                                 <div>
                                     <label className="text-xs text-neutral-500">公网 IP</label>
                                     <input list="wip_master_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.wip_master} onChange={e=>setFormData({...formData, wip_master: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-cyan-400 font-mono outline-none focus:border-cyan-500" />
                                     <datalist id="wip_master_list">
                                         {getAvailableHostIps(availablePublicIps, globalUsedPublicIps).map((ip: string) => <option key={`wip-m-${ip}`} value={ip} label={`未占用单机外网IP`} />)}
                                     </datalist>
                                 </div>
                                 <div>
                                     <label className="text-xs text-neutral-500">内网 IP</label>
                                     <input list="lip_master_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.lip_master} onChange={e=>setFormData({...formData, lip_master: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-emerald-400 font-mono outline-none focus:border-emerald-500" />
                                     <datalist id="lip_master_list">
                                         {getAvailableHostIps(availablePrivateIps, globalUsedPrivateIps).map((ip: string) => <option key={`lip-m-${ip}`} value={ip} label={`未占用单机内网IP`} />)}
                                     </datalist>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="border border-amber-900/30 rounded-xl p-5 bg-gradient-to-b from-amber-950/20 to-transparent">
                              <h4 className="text-amber-500 font-bold mb-4 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> BACKUP 节点配置</h4>
                              <div className="space-y-4">
                                 <div><label className="text-xs text-neutral-500">调度器名称</label><input type="text" value={formData.backup_name} onChange={e=>setFormData({...formData, backup_name: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-white outline-none focus:border-amber-500"/></div>
                                 <div>
                                     <label className="text-xs text-neutral-500">公网 IP</label>
                                     <input list="wip_backup_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.wip_backup} onChange={e=>setFormData({...formData, wip_backup: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-cyan-400 font-mono outline-none focus:border-cyan-500" />
                                     <datalist id="wip_backup_list">
                                         {getAvailableHostIps(availablePublicIps, globalUsedPublicIps).map((ip: string) => <option key={`wip-b-${ip}`} value={ip} label={`未占用单机外网IP`} />)}
                                     </datalist>
                                 </div>
                                 <div>
                                     <label className="text-xs text-neutral-500">内网 IP</label>
                                     <input list="lip_backup_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.lip_backup} onChange={e=>setFormData({...formData, lip_backup: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-emerald-400 font-mono outline-none focus:border-emerald-500" />
                                     <datalist id="lip_backup_list">
                                         {getAvailableHostIps(availablePrivateIps, globalUsedPrivateIps).map((ip: string) => <option key={`lip-b-${ip}`} value={ip} label={`未占用单机内网IP`} />)}
                                     </datalist>
                                 </div>
                              </div>
                           </div>
                        </div>
                    );
                })()}

                <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors" onClick={() => setAutoDeploy(!autoDeploy)}>
                   <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${autoDeploy ? 'bg-indigo-500 border-indigo-500' : 'border-neutral-600'}`}>
                     {autoDeploy && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                   </div>
                   <div className="flex-1">
                     <p className="text-sm font-bold text-white">联动下发 (Cascade Configuration Push)</p>
                     <p className="text-xs text-neutral-500">保存后自动生成 keepalived.conf 并通过 Ansible 下发。</p>
                   </div>
                </div>
             </div>
             
             <div className="p-5 border-t border-neutral-800 bg-neutral-950">
                <button onClick={handleAddNode} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg border border-indigo-400/30">
                  {submitting ? '正在创建...' : '确认创建 LVS 集群'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* 创建 / 编辑 EIP 公网大盘表单 */}
      {isEipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-sky-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl shadow-sky-900/20">
             <div className="border-b border-neutral-800 p-5 flex justify-between items-center bg-neutral-900/50">
                <h3 className="text-xl font-bold text-sky-400">{editingEipId ? t('modal.eip_edit') : t('modal.eip_add')}</h3>
                <button onClick={() => setIsEipModalOpen(false)} className="text-neutral-500 hover:text-sky-300">
                  <X className="w-5 h-5" />
                </button>
             </div>
             <form onSubmit={handleAddEip} className="p-6 space-y-5">
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-sky-500 ml-1">IP 资产分类体系</label>
                 <select 
                   value={eipFormData.asset_type}
                   onChange={e => setEipFormData({...eipFormData, asset_type: e.target.value})}
                   className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sky-100 focus:outline-none focus:border-sky-500/50 cursor-pointer mb-2"
                 >
                   <option value="PUBLIC_EIP">公网外部 IP (EIP) 与外部路由</option>
                   <option value="VIP_RESERVED">内网虚拟池 (VIP) 专用预留网段/IP</option>
                   <option value="CAB_SUBNET">物理机柜关联内网网段 (Subnets)</option>
                 </select>
               </div>
               
               {eipFormData.asset_type === "PUBLIC_EIP" && (
               <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">公网总带宽上限 (Mbps)</label>
                    <input 
                      type="number" 
                      value={eipFormData.bandwidth}
                      onChange={e => setEipFormData({...eipFormData, bandwidth: parseInt(e.target.value)})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500/50 text-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 mb-1">ISP 运营商线路</label>
                    <select
                      value={eipFormData.isp}
                      onChange={e => setEipFormData({...eipFormData, isp: e.target.value})}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500/50 text-neutral-200 cursor-pointer"
                    >
                      <option value="BGP">BGP 多线</option>
                      <option value="CTCC">中国电信 (CTCC)</option>
                      <option value="CUCC">中国联通 (CUCC)</option>
                      <option value="CMCC">中国移动 (CMCC)</option>
                      <option value="CBN">中国广电 (CBN)</option>
                      <option value="OTHER">其他/海外线路</option>
                    </select>
                  </div>
               </div>
               )}
               <div className="grid grid-cols-2 gap-4 mt-2 mb-3">
                 <div>
                   <label className="block text-xs font-semibold text-emerald-400 mb-1">物理机房分配 (Room)</label>
                   <select
                     value={eipFormData.infra_room_id || ""}
                     onChange={e => setEipFormData({...eipFormData, infra_room_id: e.target.value ? parseInt(e.target.value) : null, infra_cabinet_id: null})}
                     className="w-full bg-neutral-900 border border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-100 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                   >
                     <option value="">-- 全局资源 (无机房绑定) --</option>
                     {infraData.flatMap(dc => (
                            dc.rooms?.map((room: any) => (
                                <option key={`room-${room.id}`} value={room.id}>[{dc.name}] {room.name}</option>
                            )) || []
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-semibold text-emerald-400 mb-1">精准定位至机柜 (可选)</label>
                   <select
                     value={eipFormData.infra_cabinet_id || ""}
                     onChange={e => setEipFormData({...eipFormData, infra_cabinet_id: e.target.value ? parseInt(e.target.value) : null})}
                     disabled={!eipFormData.infra_room_id}
                     className="w-full bg-neutral-900 border border-emerald-900/50 rounded-lg px-3 py-2 text-emerald-100 focus:outline-none focus:border-emerald-500/50 cursor-pointer disabled:opacity-50"
                   >
                     <option value="">-- 机房级资源 (不限机柜) --</option>
                     {eipFormData.infra_room_id && infraData.flatMap(dc => dc.rooms || [])
                             .find(r => r.id === eipFormData.infra_room_id)?.cabinets?.map((cab: any) => (
                                <option key={`cab-${cab.id}`} value={cab.id}>{cab.name}</option>
                             ))}
                   </select>
                 </div>
               </div>
               
               <div className="pt-4 border-t border-sky-900/40 relative">
                  <div className="flex justify-between items-center mb-3">
                     <label className="block text-xs font-bold text-sky-400">
                        路由映射规则
                     </label>
                     {!editingEipId && (
                        <button type="button" onClick={() => setEipEntries([...eipEntries, { ip_address: "", target_internal_ip: "" }])} className="text-xs text-sky-300 hover:text-white bg-sky-900/50 hover:bg-sky-600 px-2 py-1 rounded transition-colors inline-block leading-none">
                          + 新增规则行
                        </button>
                     )}
                  </div>
                  {eipEntries.map((entry, idx) => (
                    <div key={`entry-${idx}`} className={`flex items-start gap-2 mb-3 bg-neutral-900 border ${eipFormData.asset_type === 'PUBLIC_EIP' ? 'border-sky-900/30' : 'border-neutral-800'} p-3 rounded-lg relative`}>
                      <div className="flex-1 space-y-3">
                         <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-bold text-neutral-400">网络地址 (如 203.0.113.1 亦支持 CIDR 简写)</label>
                           <input 
                             type="text" 
                             value={entry.ip_address}
                             onChange={e => {
                                 const newEntries = [...eipEntries]; 
                                 newEntries[idx].ip_address = e.target.value; 
                                 setEipEntries(newEntries);
                             }}
                             className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-sm text-sky-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500/50 disabled:opacity-50"
                             placeholder="源 IP"
                           />
                         </div>
                         {eipFormData.asset_type === "PUBLIC_EIP" && (
                         <div className="flex flex-col gap-1">
                           <label className="text-[10px] font-bold text-emerald-500">内网承接 (被锁定在该机房内)</label>
                           <select
                             value={entry.target_internal_ip || ""}
                             onChange={e => {
                                 const newEntries = [...eipEntries]; 
                                 newEntries[idx].target_internal_ip = e.target.value; 
                                 setEipEntries(newEntries);
                             }}
                             disabled={!eipFormData.infra_room_id}
                             className="w-full bg-neutral-950 border border-emerald-900/30 rounded px-2 py-1.5 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500/50 disabled:opacity-40 cursor-pointer"
                           >
                              <option value="">{!eipFormData.infra_room_id ? "-- 指定机房后激活 --" : "-- 无下挂 (保留空闲状态) --"}</option>
                              {eipFormData.infra_room_id && eips.filter(e => e.infra_room_id === eipFormData.infra_room_id && e.asset_type !== 'PUBLIC_EIP').map(e => (
                                 <option key={`opt-eip-${idx}-${e.id}`} value={e.ip_address}>
                                     {`[${e.asset_type === 'CAB_SUBNET' ? '真实机架互联' : '核心 VIP 预留'}] - ${e.ip_address}`}
                                 </option>
                              ))}
                           </select>
                         </div>
                         )}
                      </div>
                      {!editingEipId && eipEntries.length > 1 && (
                         <button type="button" title="移除此公网实体配置" onClick={() => setEipEntries(eipEntries.filter((_, i) => i !== idx))} className="mt-6 text-neutral-500 hover:text-red-400 p-1 bg-red-900/10 hover:bg-red-900/30 rounded">
                            <X className="w-4 h-4" />
                         </button>
                      )}
                    </div>
                  ))}
               </div>
               <div className="flex justify-end gap-3 pt-6 border-t border-neutral-800/60 transition-all">
                  <button type="button" onClick={() => setIsEipModalOpen(false)} className="px-5 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200">
                    取消
                  </button>
                  <button type="submit" disabled={submitting} className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors">
                    {submitting ? '登记中...' : (editingEipId ? '保存修改' : '保存到 IP 资产库')}
                  </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* 创建 VIP 窗 */}
      {isVipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-cyan-500/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl shadow-cyan-900/20">
             <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-cyan-400">{editingVipId ? t('modal.vip_edit') : t('modal.vip_add')}</h3>
                <button onClick={() => setIsVipModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                 <div>
                    <label className="text-xs font-bold text-cyan-400 mb-1 block">绑定目标机柜 (Target Cabinet / Node Group)</label>
                    <select value={vipFormData.targetCabinetId || ""} onChange={e => setVipFormData({...vipFormData, targetCabinetId: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-black border border-cyan-900/50 rounded p-3 text-cyan-300 outline-none font-bold">
                        
                        {infraData.flatMap(dc => (
                                dc.rooms?.map((room: any) => (
                                    <optgroup key={`vip-room-${room.id}`} label={`[${dc.name}] ${room.name}`}>
                                        {room.cabinets?.map((cab: any) => (
                                            <option key={cab.id} value={cab.id}>{cab.name}</option>
                                        ))}
                                    </optgroup>
                                )) || []
                        ))}
                    </select>
                 </div>

                 <div className="flex flex-col gap-1">
                    <label className="text-xs text-cyan-500 font-bold ml-1">{editingVipId ? "内网隧道地址" : "VIP 地址"}</label>
                    {editingVipId ? (
                        <input disabled value={vipFormData.vipAddress} className="w-full bg-black border border-neutral-800 rounded p-3 outline-none font-mono text-sm text-neutral-600 cursor-not-allowed" />
                    ) : (
                        <>
                        <SmartCombobox disabled={!!editingVipId} theme="cyan" placeholder="-- 请手动输入单机 VIP 或从级联网络筛选 --" value={vipFormData.vipAddress} onChange={(e:any) => setVipFormData({...vipFormData, vipAddress: e.target.value})} options={getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE") && (!vipFormData.targetCabinetId || e.infra_cabinet_id === vipFormData.targetCabinetId)), globalUsedPrivateIps, 100)} />
                        </>
                    )}
                 </div>

                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">端口号</label>
                 <input type="number" value={vipFormData.port} onChange={e => setVipFormData({...vipFormData, port: parseInt(e.target.value)})} className="w-full bg-black border border-neutral-800 rounded p-3 text-cyan-400 outline-none font-mono" placeholder="端口号" />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">应用标识 (App Domain)</label>
                 <input type="text" value={vipFormData.serviceName} onChange={e => setVipFormData({...vipFormData, serviceName: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-white outline-none" placeholder="应用标识 (App Domain)" />
                 </div>
                 
                 <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-xs font-bold text-neutral-500 ml-1">分发算法 (LVS Algo)</label>
                        <select value={vipFormData.lbAlgorithm} onChange={e => setVipFormData({...vipFormData, lbAlgorithm: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-white outline-none">
                            <option value="wlc">wlc (加权最少连接)</option>
                            <option value="rr">rr (轮询调度)</option>
                            <option value="wrr">wrr (加权轮询)</option>
                            <option value="lc">lc (最少连接)</option>
                            <option value="sh">sh (源地址哈希)</option>
                            <option value="dh">dh (目的地址哈希)</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1 w-1/2">
                        <label className="text-xs font-bold text-neutral-500 ml-1">运行模式 (LVS Kind)</label>
                        <select value={vipFormData.forwardingMode} onChange={e => setVipFormData({...vipFormData, forwardingMode: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-white outline-none">
                            <option value="DR">DR (直接路由 - 性能极高)</option>
                            <option value="NAT">NAT (网络地址转换)</option>
                            <option value="TUN">TUN (IP 隧道 - 广域网)</option>
                        </select>
                    </div>
                 </div>
                 <button onClick={handleAddVip} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold p-3 rounded-xl mt-2 transition-colors">
                    {editingVipId ? "保存 VIP 配置" : "创建 VIP"}
                 </button>
             </div>
          </div>
        </div>
      )}
      {/* Nginx 专属删除警报 */}
      {nginxDeleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-950 border-2 border-red-500/50 w-full max-w-sm rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">
             <div className="bg-red-950/30 border-b border-red-900/50 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-red-500 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> {t('modal.nginx_del_title')}</h3>
                <button onClick={() => setNginxDeleteConfirmModal({isOpen: false, type: '', id: null})} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-6 text-center">
                <p className="text-neutral-300 font-mono text-sm leading-relaxed">
                   {t('modal.nginx_del_msg1')}<br/><br/>
                   <span className="text-red-400">🚨 {t('modal.nginx_del_msg2')}</span>
                </p>
                <div className="flex gap-4 w-full">
                    <button onClick={() => setNginxDeleteConfirmModal({isOpen: false, type: '', id: null})} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">取消</button>
                    <button onClick={handleConfirmDeleteNginx} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.5)]">确认删除</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {isNginxClusterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-purple-500/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/20">
             <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-purple-500">{editingNginxClusterId ? t('modal.nginx_cluster_edit') : t('modal.nginx_cluster_add')}</h3>
                <button onClick={() => setIsNginxClusterModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">所属机柜 (Physical Cabinet)</label>
                     <select value={nginxClusterFormData.infra_cabinet_id || ""} onChange={e => setNginxClusterFormData({...nginxClusterFormData, infra_cabinet_id: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-black border border-purple-900/50 rounded p-3 text-purple-300 outline-none font-bold appearance-none">
                         {infraData.flatMap(dc => (
                                 dc.rooms?.map((room: any) => (
                                     <optgroup key={`nc-room-${room.id}`} label={`[${dc.name}] ${room.name}`}>
                                         {room.cabinets?.map((cab: any) => (
                                             <option key={cab.id} value={cab.id}>{cab.name}</option>
                                         ))}
                                     </optgroup>
                                 )) || []
                         ))}
                     </select>
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">集群名称 (Name)</label>
                     <input type="text" value={nginxClusterFormData.name} onChange={e => setNginxClusterFormData({...nginxClusterFormData, name: e.target.value})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-purple-500 transition-colors" placeholder="e.g. API-Gateway-Alpha"/>
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">节点 IP 列表 (内网 IP，逗号分隔)</label>
                     <input type="text" value={nginxClusterFormData.nodes_ips} onChange={e => setNginxClusterFormData({...nginxClusterFormData, nodes_ips: e.target.value})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-purple-500 transition-colors" placeholder="e.g. 192.168.1.100,192.168.1.101"/>
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">登录用户 (Login User)</label>
                     <input type="text" value={nginxClusterFormData.ssh_user} onChange={e => setNginxClusterFormData({...nginxClusterFormData, ssh_user: e.target.value})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-purple-500 transition-colors" placeholder="e.g. root" />
                 </div>
                 <button onClick={handleNginxClusterSubmit} disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold p-3 rounded-xl mt-4 transition-colors">保存 Nginx 集群</button>
             </div>
          </div>
        </div>
      )}

      {isNginxZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-indigo-500/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/20">
             <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-indigo-500">{editingNginxZoneId ? t('modal.nginx_zone_edit') : t('modal.nginx_zone_add')}</h3>
                <button onClick={() => setIsNginxZoneModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">接入域名 (Domain)</label>
                     <input type="text" value={nginxFormData.domain} onChange={e => setNginxFormData({...nginxFormData, domain: e.target.value})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 font-mono tracking-wider transition-colors" placeholder="e.g. api.yourspace.net"/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1">
                         <label className="text-xs font-bold text-neutral-500 ml-1">监听端口</label>
                         <input type="number" value={nginxFormData.listen_port} onChange={e => setNginxFormData({...nginxFormData, listen_port: parseInt(e.target.value) || 80})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 transition-colors" />
                     </div>
                     <div className="flex flex-col gap-1">
                         <label className="text-xs font-bold text-neutral-500 ml-1">SSL 开关</label>
                         <select value={nginxFormData.ssl_enabled} onChange={e => setNginxFormData({...nginxFormData, ssl_enabled: parseInt(e.target.value)})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-indigo-500 transition-colors">
                             <option value={0}>禁用 (HTTP Plain)</option>
                             <option value={1}>启动 (HTTPS Encrypted)</option>
                         </select>
                     </div>
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">关联 Nginx 集群</label>
                     <select 
                         value={nginxFormData.cluster_id || ""} 
                         onChange={e => setNginxFormData({...nginxFormData, cluster_id: e.target.value ? parseInt(e.target.value) : null})} 
                         className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-neutral-300 outline-none focus:border-indigo-500 font-mono"
                     >
                         <option value="">-- 未分配 --</option>
                         {nginxClusters.map(cls => (
                             <option key={cls.id} value={cls.id}>[接入集群] {cls.name} ({cls.nodes_ips})</option>
                         ))}
                     </select>
                 </div>
                 
                 <button onClick={handleNginxZoneSubmit} disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold p-3 rounded-xl mt-4 transition-colors">保存虚拟主机</button>
             </div>
          </div>
        </div>
      )}

      {isNginxUpstreamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-fuchsia-500/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl shadow-fuchsia-900/20">
             <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-fuchsia-500">{editingNginxUpstreamId ? t('modal.nginx_upstream_edit') : t('modal.nginx_upstream_add')}</h3>
                <button onClick={() => setIsNginxUpstreamModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                 <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-2 flex flex-col gap-1">
                         <label className="text-xs font-bold text-neutral-500 ml-1">后端 IP</label>
                         <input type="text" value={nginxUpstreamFormData.ip_address} onChange={e => setNginxUpstreamFormData({...nginxUpstreamFormData, ip_address: e.target.value})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-fuchsia-500 font-mono tracking-wider transition-colors" placeholder="e.g. 10.0.0.100"/>
                     </div>
                     <div className="flex flex-col gap-1">
                         <label className="text-xs font-bold text-neutral-500 ml-1">后端端口</label>
                         <input type="number" value={nginxUpstreamFormData.port} onChange={e => setNginxUpstreamFormData({...nginxUpstreamFormData, port: parseInt(e.target.value) || 8080})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-fuchsia-500 transition-colors" />
                     </div>
                 </div>
                 
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">权重 (Weight)</label>
                     <input type="number" value={nginxUpstreamFormData.weight} onChange={e => setNginxUpstreamFormData({...nginxUpstreamFormData, weight: parseInt(e.target.value) || 10})} className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white outline-none focus:border-fuchsia-500 transition-colors" />
                 </div>

                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">关联虚拟主机 (Zone)</label>
                     <select 
                         value={nginxUpstreamFormData.zone_id || ""} 
                         onChange={e => setNginxUpstreamFormData({...nginxUpstreamFormData, zone_id: e.target.value ? parseInt(e.target.value) : null})} 
                         className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-neutral-300 outline-none focus:border-fuchsia-500 font-mono"
                     >
                         <option value="">-- 未关联 --</option>
                         {nginxZones.map(z => (
                             <option key={z.id} value={z.id}>[归属域] {z.domain} (Port: {z.listen_port})</option>
                         ))}
                     </select>
                 </div>
                 
                 <button onClick={handleNginxUpstreamSubmit} disabled={submitting} className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold p-3 rounded-xl mt-4 transition-colors">保存后端节点 (Upstream)</button>
             </div>
          </div>
        </div>
      )}

      {/* 创建 RS 窗 */}
      {isServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-amber-500/30 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/20">
             <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-amber-500">{editingServerId ? t('modal.rs_edit') : t('modal.rs_add')}</h3>
                <button onClick={() => setIsServerModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-6 flex flex-col gap-4">
                                  <div>
                     <label className="text-xs font-bold text-amber-500 mb-1 block">机柜筛选 (Target Cabinet)</label>
                     <select value={(serverFormData as any).targetCabinetId || ""} onChange={e => setServerFormData({...serverFormData, targetCabinetId: e.target.value ? parseInt(e.target.value) : null} as any)} className="w-full bg-black border border-amber-900/50 rounded p-3 text-amber-300 outline-none font-bold focus:border-amber-500">
                         
                         {infraData.flatMap(dc => (
                                 dc.rooms?.map((room: any) => (
                                     <optgroup key={`rs-room-${room.id}`} label={`[${dc.name}] ${room.name}`}>
                                         {room.cabinets?.map((cab: any) => (
                                             <option key={cab.id} value={cab.id}>{cab.name}</option>
                                         ))}
                                     </optgroup>
                                 )) || []
                         ))}
                     </select>
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">服务器名称</label>
                 <input type="text" value={serverFormData.serverName} onChange={e => setServerFormData({...serverFormData, serverName: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-amber-400 placeholder-neutral-700 outline-none" placeholder="服务器名称" />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">{editingServerId ? "服务器内网 IP (编辑模式固定)" : "服务器 IP 或 IP 段 (支持 192.168.1.10-192.168.1.20)"}</label>
                 <SmartCombobox disabled={!!editingServerId} theme="amber" placeholder="例如区间：192.168.1.50-192.168.1.60" value={serverFormData.serverIp} onChange={(e:any) => setServerFormData({...serverFormData, serverIp: e.target.value})} options={getAvailableHostIps(eips.filter((e:any) => (e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE") && (!(serverFormData as any).targetCabinetId || e.infra_cabinet_id === (serverFormData as any).targetCabinetId)), globalUsedPrivateIps, 100)} />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">端口号</label>
                 <input type="number" value={serverFormData.port} onChange={e => setServerFormData({...serverFormData, port: parseInt(e.target.value)})} className="w-full bg-black border border-neutral-800 rounded p-3 text-white outline-none font-mono" placeholder="端口号" />
                 </div>
                 <div className="flex flex-col gap-1">
                     <label className="text-xs font-bold text-neutral-500 ml-1">节点状态 (ON/OFF)</label>
                     <select value={serverFormData.status} onChange={e => setServerFormData({...serverFormData, status: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-3 text-white outline-none font-bold">
                        <option value="ON">ON (正常接管流控)</option>
                        <option value="OFF">OFF (手动下线停机维护)</option>
                     </select>
                 </div>
                 
                 <div>
                    <label className="text-xs font-bold text-amber-500 mb-1 block">绑定 VIP (Attach to VIP)</label>
                    <select value={serverFormData.targetVipId || ""} onChange={e => setServerFormData({...serverFormData, targetVipId: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-black border border-amber-900/50 rounded p-3 text-amber-200 outline-none font-bold">
                        <option value="">-- 暂不绑定 VIP --</option>
                        {vips.map(v => (
                            <option key={v.id} value={v.id}>
                                [{v.serviceName || "未命名业务"}] {v.vipAddress}:{v.port} - Mode {v.forwardingMode}
                            </option>
                        ))}
                    </select>
                 </div>

                 <button onClick={handleAddServer} className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold p-3 rounded-xl mt-2 transition-colors">
                    {editingServerId ? "保存修改" : "创建并绑定服务器"}
                 </button>
             </div>
          </div>
        </div>
      )}

        </div> {/* 结束右半区滚动内容块 */}

      {/* Ansible 日志播放窗 */}
      {isAnsibleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-purple-500/50 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[70vh]">
             <div className="bg-[#1e1e1e] border-b border-purple-500/30 p-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                   <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500"/>
                       <div className="w-3 h-3 rounded-full bg-yellow-500"/>
                       <div className="w-3 h-3 rounded-full bg-green-500"/>
                   </div>
                   <h3 className="text-sm font-mono text-neutral-400 flex items-center gap-2"><Terminal className="w-4 h-4"/> L7 Dispatch Workflow Console</h3>
                </div>
                <button onClick={() => setIsAnsibleModalOpen(false)} className="text-neutral-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="p-4 bg-black flex-1 overflow-y-auto font-mono text-sm leading-relaxed">
                 {ansibleLogs.length === 0 ? (
                     <span className="text-neutral-600 flex items-center gap-2"><Activity className="w-4 h-4 animate-spin"/> Awaiting dispatch signal...</span>
                 ) : (
                     ansibleLogs.map((log, idx) => {
                         if (!log || typeof log !== 'string') return null;
                         let color = "text-neutral-300";
                         if (log.includes("SUCCESS")) color = "text-emerald-400 font-bold";
                         if (log.includes("ERROR") || log.includes("Failed")) color = "text-red-400 font-bold";
                         if (log.includes(">")) color = "text-cyan-400";
                         return <div key={idx} className={`${color} mb-1 flex items-start`}><span className="mr-2 opacity-50 shrink-0">{`[${idx.toString().padStart(2, '0')}]`}</span> {log}</div>
                     })
                 )}
             </div>
          </div>
        </div>
      )}
  
      {/* 统一下发风险操作确认模态舱 (Custom Confirm Dialog) */}
      {customConfirm.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] max-w-md w-full relative animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500" /> {t('modal.confirm_title')}</h3>
             <p className="text-neutral-400 text-sm mb-8 leading-relaxed font-mono whitespace-pre-wrap">{customConfirm.message}</p>
             <div className="flex gap-4 justify-end">
                <button onClick={() => setCustomConfirm(p => ({...p, isOpen: false}))} className="px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors font-bold text-sm">取消挂起</button>
                <button onClick={() => { customConfirm.onConfirm(); setCustomConfirm(p => ({...p, isOpen: false})); }} className="px-5 py-2.5 rounded-xl bg-red-600/80 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-colors font-bold text-sm flex items-center gap-2">
                   <ShieldAlert className="w-4 h-4" /> 决议执行
                </button>
             </div>
          </div>
        </div>
      )}

    </main>
</div>
  );
}
