with open('src/app/page.tsx', 'r') as f:
    text = f.read()

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

new_vip = """                        <input list="vip_pool_options" type="text" placeholder="-- 请填入或从专属可用 VIP 资源中挑取单机 IP --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 outline-none font-mono text-sm text-cyan-400 cursor-text" />
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲实体独立 VIP"/>)}
                        </datalist>"""

if old_vip in text:
    text = text.replace(old_vip, new_vip)
    print("VIP 替换成功！")
else:
    print("未能匹配原有的 VIP 选框逻辑。")

# 对于 RS 侧，修复 eips 过滤逻辑使其更加宽泛并准确
old_rs = """{getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网IP探测"/>)}"""
new_rs = """{getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网IP探测"/>)}"""

if old_rs in text:
    text = text.replace(old_rs, new_rs)
    print("RS 过滤替换成功！")
else:
    print("未能匹配原有的 RS 侧过滤逻辑。")

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

