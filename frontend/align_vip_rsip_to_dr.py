with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 替换 VIP 侧
old_vip = """                        <select 
                          value={vipFormData.virtual_ipaddress} 
                          onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} 
                          className="w-full bg-black border border-cyan-900/50 rounded p-3 outline-none font-mono text-sm text-cyan-400 cursor-pointer"
                        >
                          <option value="">-- 请从系统预置的可用内网资产池挑取 --</option>
                          {eips.filter(e => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")).map(e => (
                              <option key={e.id} value={e.ip_address}>{e.ip_address} (专属预留)</option>
                          ))}
                        </select>"""

new_vip = """                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲专属独立 VIP" />)}
                        </datalist>"""

if old_vip in text:
    text = text.replace(old_vip, new_vip)
    print("VIP 替换成功！")
else:
    print("未能匹配原有的 VIP 选框逻辑。")

# 2. 修改 RS 过滤逻辑使其在下拉中像 DR 一样涵盖更多有效子网（而不仅限 CAB_SUBNET）
old_rs = """{getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网IP探测"/>)}"""
new_rs = """{getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网IP探测"/>)}"""

if old_rs in text:
    text = text.replace(old_rs, new_rs)
    print("RS 过滤替换成功！")
else:
    print("未能匹配原有的 RS 侧过滤逻辑。")

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

