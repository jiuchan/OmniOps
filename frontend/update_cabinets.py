import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# ======================== VIP 表单部分 ========================
# 1. 抽离老地方的 VIP 选择器
vip_cab_select = """                 <div>
                    <label className="text-xs font-bold text-cyan-400 mb-1 block">挂载防线实体 (Target Cabinet / Node Group)</label>
                    <select value={vipFormData.target_cabinet_id || ""} onChange={e => setVipFormData({...vipFormData, target_cabinet_id: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-black border border-cyan-900/50 rounded p-3 text-cyan-300 outline-none font-bold">
                        <option value="">-- [松散游离] 暂不部署至物理通道 --</option>
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
                 </div>"""

if vip_cab_select in text:
    text = text.replace(vip_cab_select + '\n                 \n', '')
    text = text.replace(vip_cab_select + '\n', '')  # 尝试删除不同数量的保留行
    text = text.replace(vip_cab_select, '')

# 2. 将此选择器前置到 VIP 表单头部
# 寻找入口 `<div className="p-6 flex flex-col gap-4">`
vip_target_entry = r'(<div className="p-6 flex flex-col gap-4">)(\s*<div className="flex flex-col gap-1">\s*<label className="text-xs text-cyan-500 font-bold ml-1">\{editingVipId \? "内网隧道地址" : "分发管控虚拟池)'
vip_injection = r'\1\n' + vip_cab_select + r'\n\2'
text = re.sub(vip_target_entry, vip_injection, text)

# 3. 追加过滤条件
vip_filter_target = 'eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE"))'
vip_filter_repl = 'eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE") && (!vipFormData.target_cabinet_id || e.infra_cabinet_id === vipFormData.target_cabinet_id))'
text = text.replace(vip_filter_target, vip_filter_repl)

# ======================== RS 表单部分 ========================
# 1. 组建新的 RS 机柜选择器
rs_cab_select = """                 <div>
                     <label className="text-xs font-bold text-amber-500 mb-1 block">挂载机房柜区 (Target Cabinet Filter)</label>
                     <select value={(serverFormData as any).target_cabinet_id || ""} onChange={e => setServerFormData({...serverFormData, target_cabinet_id: e.target.value ? parseInt(e.target.value) : null} as any)} className="w-full bg-black border border-amber-900/50 rounded p-3 text-amber-300 outline-none font-bold focus:border-amber-500">
                         <option value="">-- [全域广域] 不限定物理机柜搜索 --</option>
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
                 </div>"""

# 取巧：放置在 `<div className="flex flex-col gap-1">` 下的 "实机代号" 前面。
rs_target_entry = r'(<div className="flex flex-col gap-1">\s*<label className="text-xs font-bold text-neutral-500 ml-1">实机代号)'
rs_injection = rs_cab_select + r'\n                 \1'
text = re.sub(rs_target_entry, rs_injection, text)

# 2. 追加 RS 选项过滤
rs_filter_target = 'eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE")'
rs_filter_repl = 'eips.filter((e:any) => (e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE") && (!(serverFormData as any).target_cabinet_id || e.infra_cabinet_id === (serverFormData as any).target_cabinet_id))'
text = text.replace(rs_filter_target, rs_filter_repl)


with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("逻辑已生成并替换完成，筛选结构调整完毕。")
