with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. VIP的替换
vip_old = """                        <select 
                          value={vipFormData.virtual_ipaddress} 
                          onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} 
                          className="w-full bg-black border border-cyan-900/50 rounded p-3 outline-none font-mono text-sm text-cyan-400 cursor-pointer"
                        >
                          <option value="">-- 请从系统预置的可用内网资产池挑取 --</option>
                          {eips.filter(e => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")).map(e => (
                              <option key={e.id} value={e.ip_address}>{e.ip_address} (专属预留)</option>
                          ))}
                        </select>"""
vip_new = """                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲可用独立 VIP" />)}
                        </datalist>"""
text = text.replace(vip_old, vip_new)

# 2. RSip (实体节点IP段) 的替换
rs_old = """                 <textarea disabled={!!editingServerId} value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 outline-none font-mono min-h-[60px] ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400"}`} placeholder="例如：192.168.1.50-192.168.1.60\\n自动解析为 11个算力槽口" />"""
rs_new = """                 <input list="rs_lip_list" type="text" disabled={!!editingServerId} value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 outline-none font-mono ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400 focus:border-amber-500"}`} placeholder="例如区间：192.168.1.50-192.168.1.60 或者从单机推荐选" />
                 {!editingServerId && (
                     <datalist id="rs_lip_list">
                         {getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网 IP 探测" />)}
                     </datalist>
                 )}"""
text = text.replace(rs_old, rs_new)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("精准替换完成！VIP 和 RS 现已使用真正的 DR 逻辑（展平 Datalist 的 Input）")
