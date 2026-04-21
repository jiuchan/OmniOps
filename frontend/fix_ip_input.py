with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# WIP Master
wip_m_old = """                                     <label className="text-xs text-neutral-500">WIP (公网出口IP)</label>
                                     <select value={formData.wip_master} onChange={e=>setFormData({...formData, wip_master: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-cyan-400 font-mono outline-none focus:border-cyan-500">
                                         <option value="">-- 请选择匹配地理位置的公网 IP --</option>
                                         {availablePublicIps.map((e: any) => <option key={`wip-m-${e.id}`} value={e.ip_address}>{e.ip_address}</option>)}
                                     </select>"""
wip_m_new = """                                     <label className="text-xs text-neutral-500">WIP (公网出口IP)</label>
                                     <input list="wip_master_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.wip_master} onChange={e=>setFormData({...formData, wip_master: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-cyan-400 font-mono outline-none focus:border-cyan-500" />
                                     <datalist id="wip_master_list">
                                         {availablePublicIps.map((e: any) => <option key={`wip-m-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
text = text.replace(wip_m_old, wip_m_new)


# LIP Master
lip_m_old = """                                     <label className="text-xs text-neutral-500">LIP (内网互联IP)</label>
                                     <select value={formData.lip_master} onChange={e=>setFormData({...formData, lip_master: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-emerald-400 font-mono outline-none focus:border-emerald-500">
                                         <option value="">-- 请选择匹配地理位置的内网 IP --</option>
                                         {availablePrivateIps.map((e: any) => <option key={`lip-m-${e.id}`} value={e.ip_address}>{e.ip_address}</option>)}
                                     </select>"""
lip_m_new = """                                     <label className="text-xs text-neutral-500">LIP (内网互联IP)</label>
                                     <input list="lip_master_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.lip_master} onChange={e=>setFormData({...formData, lip_master: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-emerald-400 font-mono outline-none focus:border-emerald-500" />
                                     <datalist id="lip_master_list">
                                         {availablePrivateIps.map((e: any) => <option key={`lip-m-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
text = text.replace(lip_m_old, lip_m_new)

# WIP Backup
wip_b_old = """                                     <label className="text-xs text-neutral-500">WIP (公网出口IP)</label>
                                     <select value={formData.wip_backup} onChange={e=>setFormData({...formData, wip_backup: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-cyan-400 font-mono outline-none focus:border-cyan-500">
                                         <option value="">-- 请选择匹配地理位置的公网 IP --</option>
                                         {availablePublicIps.map((e: any) => <option key={`wip-b-${e.id}`} value={e.ip_address}>{e.ip_address}</option>)}
                                     </select>"""
wip_b_new = """                                     <label className="text-xs text-neutral-500">WIP (公网出口IP)</label>
                                     <input list="wip_backup_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.wip_backup} onChange={e=>setFormData({...formData, wip_backup: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-cyan-400 font-mono outline-none focus:border-cyan-500" />
                                     <datalist id="wip_backup_list">
                                         {availablePublicIps.map((e: any) => <option key={`wip-b-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
text = text.replace(wip_b_old, wip_b_new)

# LIP Backup
lip_b_old = """                                     <label className="text-xs text-neutral-500">LIP (内网互联IP)</label>
                                     <select value={formData.lip_backup} onChange={e=>setFormData({...formData, lip_backup: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-emerald-400 font-mono outline-none focus:border-emerald-500">
                                         <option value="">-- 请选择匹配地理位置的内网 IP --</option>
                                         {availablePrivateIps.map((e: any) => <option key={`lip-b-${e.id}`} value={e.ip_address}>{e.ip_address}</option>)}
                                     </select>"""
lip_b_new = """                                     <label className="text-xs text-neutral-500">LIP (内网互联IP)</label>
                                     <input list="lip_backup_list" type="text" placeholder="-- 手动输入单机IP 或从推荐网段选择 --" value={formData.lip_backup} onChange={e=>setFormData({...formData, lip_backup: e.target.value})} className="w-full bg-black border border-neutral-800 rounded p-2 text-emerald-400 font-mono outline-none focus:border-emerald-500" />
                                     <datalist id="lip_backup_list">
                                         {availablePrivateIps.map((e: any) => <option key={`lip-b-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
text = text.replace(lip_b_old, lip_b_new)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("完成 WIP 与 LIP 表单修改！")
