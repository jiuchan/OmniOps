import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 在 `const availablePrivateIps = ` 定义之后插入 globals
def insert_globals(match):
    return match.group(0) + """
                    // 全局互斥黑名单：所有已给 VIP / RS 记录在案的内网 IP
                    const globalUsedPrivateIps = [...vips.map(v => v.virtual_ipaddress), ...servers.map(s => s.serverip), ...servers.map(s => s.lip)].filter(Boolean) as string[];
                    // 所有已使用公网 IP
                    const globalUsedPublicIps = servers.map(s => s.wip).filter(Boolean) as string[];
"""

text = re.sub(
    r'const availablePrivateIps = eips\.filter\(\(e: any\) => \s*\(e\.asset_type && e\.asset_type !== \'PUBLIC_EIP\'\) && \s*\(!computedRoomId \|\| !e\.infra_room_id \|\| e\.infra_room_id === computedRoomId\)\s*\);',
    insert_globals,
    text
)

# 2. 更改调用的排除数组
# a. DR Master WIP
text = re.sub(
    r'(getAvailableHostIps\(availablePublicIps,\s*)servers\.map\(s => s\.wip\)\.concat\(servers\.map\(s => s\.serverip\)\) as string\[\]',
    r'\1globalUsedPublicIps',
    text
)
# b. DR Master LIP / Backup LIP / Backup WIP
text = re.sub(
    r'(getAvailableHostIps\(availablePrivateIps,\s*)servers\.map\(s => s\.lip\)\.concat\(servers\.map\(s => s\.serverip\)\) as string\[\]',
    r'\1globalUsedPrivateIps',
    text
)
# c. VIP
text = re.sub(
    r'vips\.map\(v => v\.virtual_ipaddress\) as string\[\],\s*100\)',
    r'globalUsedPrivateIps, 100)',
    text
)
# d. RS
text = re.sub(
    r'servers\.map\(s => s\.serverip\)\.concat\(servers\.map\(s => s\.lip\)\) as string\[\],\s*100\)',
    r'globalUsedPrivateIps, 100)',
    text
)

# 3. 剥离 RS 推荐中混入的 VIP_RESERVED
text = re.sub(
    r'(eips\.filter\(\(e:any\) => e\.asset_type === "CAB_SUBNET" \|\| e\.asset_type === "PRIVATE") \|\| e\.asset_type === "VIP_RESERVED"(\))',
    r'\1\2',
    text
)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("交叉占用黑名单修改成功")
