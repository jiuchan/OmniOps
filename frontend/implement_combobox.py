import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 注入组件代码
# 我们把它放在 getAvailableHostIps 的后面
inject_marker = "const getAvailableHostIps = (networks: any[], usedIps: string[], limit=60) => {"
inject_code = """const SmartCombobox = ({ value, onChange, options, disabled, theme = "cyan", placeholder = "" }: any) => {
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

"""
text = text.replace(inject_marker, inject_code + inject_marker)


# 2. 替换 DR 的 WIP (Master)
text = re.sub(
    r'<input list="wip_master_list" type="text" value={masterFormData\.wip} onChange=\{e => setMasterFormData\(\{\.\.\.masterFormData, wip: e\.target\.value\}\)\} className="w-full bg-black border border-fuchsia-900/50 rounded p-3 outline-none font-mono text-sm text-fuchsia-400 focus:border-fuchsia-500" placeholder="Master 公网 IP" />\s*<datalist id="wip_master_list">\s*\{getAvailableHostIps\(availablePublicIps, servers\.map\(s => s\.wip\)\.concat\(servers\.map\(s => s\.serverip\)\) as string\[\]\)\.map\(\(ip: string\) => <option key=\{`wip-m-\$\{ip\}`\} value=\{ip\} label=\{`未占用单机外网IP`\} />\)\}\s*</datalist>',
    r'<SmartCombobox theme="cyan" value={masterFormData.wip} onChange={(e:any) => setMasterFormData({...masterFormData, wip: e.target.value})} options={getAvailableHostIps(availablePublicIps, servers.map(s => s.wip).concat(servers.map(s => s.serverip)) as string[])} placeholder="Master 公网 IP" />',
    text
)

# 3. 替换 DR 的 LIP (Master)
text = re.sub(
    r'<input list="lip_master_list" type="text" value={masterFormData\.lip} onChange=\{e => setMasterFormData\(\{\.\.\.masterFormData, lip: e\.target\.value\}\)\} className="w-full bg-black border border-cyan-900/50 rounded p-3 outline-none font-mono text-sm text-cyan-400 focus:border-cyan-500" placeholder="Master 内网 IP" />\s*<datalist id="lip_master_list">\s*\{getAvailableHostIps\(availablePrivateIps, servers\.map\(s => s\.lip\)\.concat\(servers\.map\(s => s\.serverip\)\) as string\[\]\)\.map\(\(ip: string\) => <option key=\{`lip-m-\$\{ip\}`\} value=\{ip\} label=\{`未占用单机内网IP`\} />\)\}\s*</datalist>',
    r'<SmartCombobox theme="cyan" value={masterFormData.lip} onChange={(e:any) => setMasterFormData({...masterFormData, lip: e.target.value})} options={getAvailableHostIps(availablePrivateIps, servers.map(s => s.lip).concat(servers.map(s => s.serverip)) as string[])} placeholder="Master 内网 IP" />',
    text
)

# 4. 替换 DR 的 WIP (Backup)
text = re.sub(
    r'<input list="wip_backup_list" type="text" disabled={!needBackup} value={backupFormData\.wip} onChange=\{e => setBackupFormData\(\{\.\.\.backupFormData, wip: e\.target\.value\}\)\} className="w-full bg-black border border-fuchsia-900/50 rounded p-3 outline-none font-mono text-sm text-fuchsia-400 focus:border-fuchsia-500 disabled:opacity-30 disabled:cursor-not-allowed" placeholder="Backup 公网 IP" />\s*<datalist id="wip_backup_list">\s*\{getAvailableHostIps\(availablePublicIps, servers\.map\(s => s\.wip\)\.concat\(servers\.map\(s => s\.serverip\)\) as string\[\]\)\.map\(\(ip: string\) => <option key=\{`wip-b-\$\{ip\}`\} value=\{ip\} label=\{`未占用单机外网IP`\} />\)\}\s*</datalist>',
    r'<SmartCombobox disabled={!needBackup} theme="cyan" value={backupFormData.wip} onChange={(e:any) => setBackupFormData({...backupFormData, wip: e.target.value})} options={getAvailableHostIps(availablePublicIps, servers.map(s => s.wip).concat(servers.map(s => s.serverip)) as string[])} placeholder="Backup 公网 IP" />',
    text
)

# 5. 替换 DR 的 LIP (Backup)
text = re.sub(
    r'<input list="lip_backup_list" type="text" disabled={!needBackup} value={backupFormData\.lip} onChange=\{e => setBackupFormData\(\{\.\.\.backupFormData, lip: e\.target\.value\}\)\} className="w-full bg-black border border-cyan-900/50 rounded p-3 outline-none font-mono text-sm text-cyan-400 focus:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed" placeholder="Backup 内网 IP" />\s*<datalist id="lip_backup_list">\s*\{getAvailableHostIps\(availablePrivateIps, servers\.map\(s => s\.lip\)\.concat\(servers\.map\(s => s\.serverip\)\) as string\[\]\)\.map\(\(ip: string\) => <option key=\{`lip-b-\$\{ip\}`\} value=\{ip\} label=\{`未占用单机内网IP`\} />\)\}\s*</datalist>',
    r'<SmartCombobox disabled={!needBackup} theme="cyan" value={backupFormData.lip} onChange={(e:any) => setBackupFormData({...backupFormData, lip: e.target.value})} options={getAvailableHostIps(availablePrivateIps, servers.map(s => s.lip).concat(servers.map(s => s.serverip)) as string[])} placeholder="Backup 内网 IP" />',
    text
)

# 6. 替换 VIP (之前的带有假三角的区块)
vip_old = """                        <>
                        <div className="relative">
                        <input list="vip_pool_options" type="text" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={e => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} className="w-full bg-black border border-cyan-900/50 rounded p-3 pr-10 font-mono text-sm text-cyan-400 outline-none focus:border-cyan-500" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500 text-[10px]">▼</div>
                        <datalist id="vip_pool_options">
                          {getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100).map((ip: string) => <option key={`vip-opt-${ip}`} value={ip} label="空闲可用独立 VIP" />)}
                        </datalist>
                        </div>
                        </>"""
vip_new = """                        <SmartCombobox theme="cyan" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={(e:any) => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} options={getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100)} />"""
text = text.replace(vip_old, vip_new)

# 如果上面没匹配（可能因为 Fragment 换行格式问题），用正则
text = re.sub(
    r'<>\s*<div className="relative">\s*<input list="vip_pool_options" .*? />\s*<div className="absolute .*?">▼</div>\s*<datalist id="vip_pool_options">.*?</datalist>\s*</div>\s*</>',
    r'<SmartCombobox theme="cyan" placeholder="-- 请手动输入单机 VIP 或从下拉推荐网段内挑选 --" value={vipFormData.virtual_ipaddress} onChange={(e:any) => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} options={getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100)} />',
    text,
    flags=re.DOTALL
)


# 7. 替换 RS (之前的带有假三角的区块)
rs_old = """                 <div className="relative">
                 <input list="rs_lip_list" type="text" disabled={!!editingServerId} value={serverFormData.serverip} onChange={e => setServerFormData({...serverFormData, serverip: e.target.value})} className={`w-full bg-black border border-neutral-800 rounded p-3 pr-10 outline-none font-mono ${editingServerId ? "text-neutral-600 cursor-not-allowed" : "text-amber-400 focus:border-amber-500"}`} placeholder="例如区间：192.168.1.50-192.168.1.60 或者从单机推荐选" />
                 {!editingServerId && <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500 text-[10px]">▼</div>}
                 {!editingServerId && (
                     <datalist id="rs_lip_list">
                         {getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100).map((ip: string) => <option key={`rs-opt-${ip}`} value={ip} label="空闲实体可用内网 IP 探测" />)}
                     </datalist>
                 )}
                 </div>"""
rs_new = """                 <SmartCombobox disabled={!!editingServerId} theme="amber" placeholder="例如区间：192.168.1.50-192.168.1.60" value={serverFormData.serverip} onChange={(e:any) => setServerFormData({...serverFormData, serverip: e.target.value})} options={getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100)} />"""
text = text.replace(rs_old, rs_new)

text = re.sub(
    r'<div className="relative">\s*<input list="rs_lip_list" .*? />\s*\{!editingServerId && <div .*?>▼</div>\}\s*\{!editingServerId && \(\s*<datalist id="rs_lip_list">.*?</datalist>\s*\)\}\s*</div>',
    r'<SmartCombobox disabled={!!editingServerId} theme="amber" placeholder="例如区间：192.168.1.50-192.168.1.60" value={serverFormData.serverip} onChange={(e:any) => setServerFormData({...serverFormData, serverip: e.target.value})} options={getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100)} />',
    text,
    flags=re.DOTALL
)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("SmartCombobox 自动渲染下拉组件注入完成，并替换掉了所有 datalist 节点！")
