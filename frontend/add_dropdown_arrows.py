with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. VIP的替换
vip_old = """                        <>
                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲可用独立 VIP" />)}
                        </datalist>
                        </>"""

vip_new = """                        <div className="relative">
                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 pr-10 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500 text-[10px]">▼</div>
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲可用独立 VIP" />)}
                        </datalist>
                        </div>"""
text = text.replace(vip_old, vip_new)

# 2. RSip 替换
rs_old = """                 <input list="rs_lip_list" type="text" disabled={!!editingServerId} value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 outline-none font-mono ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400 focus:border-amber-500"}`} placeholder="例如区间：192.168.1.50-192.168.1.60 或者从单机推荐选" />
                 {!editingServerId && (
                     <datalist id="rs_lip_list">
                         {getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网 IP 探测" />)}
                     </datalist>
                 )}"""

rs_new = """                 <div className="relative">
                 <input list="rs_lip_list" type="text" disabled={!!editingServerId} value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 pr-10 outline-none font-mono ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400 focus:border-amber-500"}`} placeholder="例如区间：192.168.1.50-192.168.1.60 或者从单机推荐选" />
                 {!editingServerId && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 text-[10px]">▼</div>}
                 {!editingServerId && (
                     <datalist id="rs_lip_list">
                         {getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网 IP 探测" />)}
                     </datalist>
                 )}
                 </div>"""
text = text.replace(rs_old, rs_new)


with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("为新版输入框新增视觉引导（三角符号）完成！")
