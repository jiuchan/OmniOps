import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 替换老旧的 VIP Dataclist 结构。通过查找 `<input list="vip_pool_options"` 所在行和 `</datalist>`
# 将它们整个替换为新的 SmartCombobox 组件。

target_structure = r'<input list="vip_pool_options"(.*?)/>\s*<datalist id="vip_pool_options">\s*\{getAvailableHostIps\((.*?), globalUsedPrivateIps, 100\)\.map\(\(ip: string\) => <option key={`vip-opt-\$\{ip\}`} value=\{ip\} label="空闲专属独立 VIP" />\)\}\s*</datalist>'
replacement = r'<SmartCombobox disabled={!!editingVipId} theme="cyan" placeholder="-- 请手动输入单机 VIP 或从级联网络筛选 --" value={vipFormData.virtual_ipaddress} onChange={(e:any) => setVipFormData({...vipFormData, virtual_ipaddress: e.target.value})} options={getAvailableHostIps(\2, globalUsedPrivateIps, 100)} />'

text = re.sub(target_structure, replacement, text, flags=re.DOTALL)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("为 VIP 实现了 SmartCombobox 组件升级，与 RS/DR 组件大统一。")
