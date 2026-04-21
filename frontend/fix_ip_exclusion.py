import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 寻找组件内部的顶部适当位置注入全局占用池。
# 我们找 `const availablePublicIps = eips.filter...` 这个块
marker = 'const availablePublicIps = eips.filter((e: any) => e.asset_type === "PUBLIC");\n    const availablePrivateIps = eips.filter((e: any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "VIP_RESERVED" || e.asset_type === "PRIVATE");'

injected_code = """const availablePublicIps = eips.filter((e: any) => e.asset_type === "PUBLIC");
    const availablePrivateIps = eips.filter((e: any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "VIP_RESERVED" || e.asset_type === "PRIVATE");

    // 全局互斥占用黑名单！无论对哪个节点的下拉计算，都要以最高互斥维度扫描全局正在干活的 IP，保证“已被用”的一定不可选。
    const globalUsedPrivateIps = [...vips.map(v => v.virtual_ipaddress), ...servers.map(s => s.serverip), ...servers.map(s => s.lip)].filter(Boolean) as string[];
    const globalUsedPublicIps = [...servers.map(s => s.wip)].filter(Boolean) as string[];"""

if marker in text:
    text = text.replace(marker, injected_code)
else:
    print("Marker mismatch! Falling back to regex inject.")
    text = re.sub(
        r'const availablePrivateIps = [^\n]+;\n',
        lambda m: m.group(0) + '\n    const globalUsedPrivateIps = [...vips.map(v => v.virtual_ipaddress), ...servers.map(s => s.serverip), ...servers.map(s => s.lip)].filter(Boolean) as string[];\n    const globalUsedPublicIps = [...servers.map(s => s.wip)].filter(Boolean) as string[];\n',
        text
    )

# 替换所有 getAvailableHostIps 后面的排除池：

# 1. DR Master WIP
text = re.sub(
    r'(<SmartCombobox [^>]*theme="cyan"[^>]*wip\}[^>]*options=\{getAvailableHostIps\(availablePublicIps,\s*)servers[^)]*\)(?=\s*as string\[\]\)|[^)]*\)[^)]*\))',
    r'\1globalUsedPublicIps',
    text
)

# 2. DR Master LIP
text = re.sub(
    r'(<SmartCombobox [^>]*theme="cyan"[^>]*lip\}[^>]*options=\{getAvailableHostIps\(availablePrivateIps,\s*)servers[^)]*\)(?=\s*as string\[\]\)|[^)]*\)[^)]*\))',
    r'\1globalUsedPrivateIps',
    text
)

# 3. DR Backup WIP
text = re.sub(
    r'(<SmartCombobox [^>]*theme="cyan"[^>]*wip\}[^>]*options=\{getAvailableHostIps\(availablePublicIps,\s*)servers[^)]*\)(?=\s*as string\[\]\)|[^)]*\)[^)]*\))',
    r'\1globalUsedPublicIps',
    text
)

# 4. DR Backup LIP
text = re.sub(
    r'(<SmartCombobox [^>]*theme="cyan"[^>]*lip\}[^>]*options=\{getAvailableHostIps\(availablePrivateIps,\s*)servers[^)]*\)(?=\s*as string\[\]\)|[^)]*\)[^)]*\))',
    r'\1globalUsedPrivateIps',
    text
)

# 5. VIP 挑选
# 老的: options={getAvailableHostIps(eips.filter((e: any) => e.asset_type === "VIP_RESERVED" && (!e.vip_id || e.state !== "IN_USE")), vips.map(v => v.virtual_ipaddress) as string[], 100)}
text = re.sub(
    r'(<SmartCombobox [^>]*theme="cyan"[^>]*virtual_ipaddress\}[^>]*options=\{getAvailableHostIps\([^,]+,\s*)vips\.map[^,]+(,\s*100\)\})',
    r'\1globalUsedPrivateIps\2',
    text
)

# 6. RS 挑选
# 老的: options={getAvailableHostIps(eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE" || e.asset_type === "VIP_RESERVED"), servers.map(s => s.serverip).concat(servers.map(s => s.lip)) as string[], 100)}
# 注意，不仅要改 `usedIps` 参数，还得把源里面的 VIP_RESERVED 摘除
text = re.sub(
    r'(<SmartCombobox [^>]*theme="amber"[^>]*serverip\}[^>]*options=\{getAvailableHostIps\()eips\.filter\(\(e:any\) => e\.asset_type === "CAB_SUBNET" \|\| e\.asset_type === "PRIVATE" \|\| e\.asset_type === "VIP_RESERVED"\),\s*servers\.map[^,]+(,\s*100\)\})',
    r'\1eips.filter((e:any) => e.asset_type === "CAB_SUBNET" || e.asset_type === "PRIVATE"), globalUsedPrivateIps\2',
    text
)

# 保存文件
with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("全局内网隔离替换完成！已保证互相排斥")
