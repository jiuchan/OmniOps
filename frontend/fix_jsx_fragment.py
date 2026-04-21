with open('src/app/page.tsx', 'r') as f:
    text = f.read()

target = """                    ) : (
                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲专属独立 VIP" />)}
                        </datalist>
                    )}"""

replacement = """                    ) : (
                        <>
                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲专属独立 VIP" />)}
                        </datalist>
                        </>
                    )}"""

if target in text:
    with open('src/app/page.tsx', 'w') as f:
        f.write(text.replace(target, replacement))
    print("JSX 语法修复完成！加了 Fragment 空包裹。")
else:
    print("未能匹配，检查 target！")

