with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. VIP Form modification
vip_old = """                        <select 
                          value={vipFormData.virtual_ipaddress} 
                          onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})}
                          className="w-full bg-black border border-neutral-800 rounded p-3 text-cyan-400 font-mono outline-none focus:border-cyan-500"
                        >
                           <option value="">-- 请从系统预置的可用内网资产池挑取 --</option>
                           {infraData.flatMap(dc => (
                               dc.rooms?.flatMap((room: any) => (
                                   eips.filter((e: any) => e.infra_room_id === room.id && e.asset_type === "VIP_RESERVED")
                                       .map((e: any) => <option key={`vip-opt-${e.id}`} value={e.ip_address}>{e.ip_address} ({room.name} 专属预留)</option>)
                               ))
                           ))}
                        </select>"""
vip_new = """                        <input 
                          list="vip_reserved_list"
                          type="text" 
                          placeholder="-- 手打或从下方提供的系统资产池空闲可用 VIP 列表中挑取 --"
                          value={vipFormData.virtual_ipaddress} 
                          onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})}
                          className="w-full bg-black border border-neutral-800 rounded p-3 text-cyan-400 font-mono outline-none focus:border-cyan-500"
                        />
                        <datalist id="vip_reserved_list">
                           {getAvailableHostIps(eips.filter((e:any) => e.asset_type === "VIP_RESERVED"), vips.map(v => v.virtual_ipaddress), 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="系统预分配的未占用真实VIP"/>)}
                        </datalist>"""
if vip_old in text:
    text = text.replace(vip_old, vip_new)

# 2. RS Form modification
rs_old = """                 <textarea disabled={!!editingServerId} value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 outline-none font-mono min-h-[60px] ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400"}`} placeholder="例如：192.168.1.50-192.168.1.60\\n自动解析为 11个算力槽口" />"""
rs_new = """                 <input list="rs_lip_list" disabled={!!editingServerId} type="text" value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 outline-none font-mono ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400 focus:border-amber-500"}`} placeholder="例如：192.168.1.50 或区间 192.168.1.50-192.168.1.60\n(支持批量添加)" />
                 {!editingServerId && (
                    <datalist id="rs_lip_list">
                       {getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网IP探测"/>)}
                    </datalist>
                 )}"""
if rs_old in text:
    text = text.replace(rs_old, rs_new)


with open('src/app/page.tsx', 'w') as f:
    f.write(text)
print("VIP 与 RS 表单修改完毕！")
