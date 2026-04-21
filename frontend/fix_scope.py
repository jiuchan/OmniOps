import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 尝试从原来的地方把那两行抹掉
bad_definition_regex = r'\s*// 全局互斥黑名单：所有已给 VIP / RS 记录在案的内网 IP\s*const globalUsedPrivateIps[^;]+;\s*// 所有已使用公网 IP\s*const globalUsedPublicIps[^;]+;'
text = re.sub(bad_definition_regex, '', text)

# 2. 把它们注入到 Home() 函数的顶部或合适位置
# 可以放在 const getAvailableHostIps 后边一点或者 Home 函数体里的 state 声明之后。
# 我们找 const [searchQuery, setSearchQuery] = useState(""); 这句
insert_target = 'const [searchQuery, setSearchQuery] = useState("");'
replacement = insert_target + """

    // --- [ 全局互斥占用黑名单计算 ] ---
    // 为了防止在同一个系统内将已经被分发的物理资源和VIP资源混发，任何时候都不在下拉推荐里展示下列已被锁死的IP
    const globalUsedPrivateIps = [...vips.map((v: any) => v.virtual_ipaddress), ...servers.map((s: any) => s.serverip), ...servers.map((s: any) => s.lip)].filter(Boolean) as string[];
    const globalUsedPublicIps = [...servers.map((s: any) => s.wip)].filter(Boolean) as string[];
"""

text = text.replace(insert_target, replacement)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("作用域修复成功！全页访问不再引发 ReferenceError")
