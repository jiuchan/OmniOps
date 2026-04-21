with open('src/app/page.tsx', 'r') as f:
    text = f.read()

target = 'const [activeTab, setActiveTab] = useState("dash");'
replacement = target + """
  
  // --- [ 全局互斥占用黑名单计算 ] ---
  const globalUsedPrivateIps = [...vips.map((v: any) => v.virtual_ipaddress), ...servers.map((s: any) => s.serverip), ...servers.map((s: any) => s.lip)].filter(Boolean) as string[];
  const globalUsedPublicIps = [...servers.map((s: any) => s.wip)].filter(Boolean) as string[];
"""

if target in text:
    text = text.replace(target, replacement)
    with open('src/app/page.tsx', 'w') as f:
        f.write(text)
    print("注入成功！变量提升到底层依赖顶部")
else:
    print("FATAL: 目标字符串不存在于文件中")
