import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 抹除非法置顶的代码
bad_block = """  // --- [ 全局互斥占用黑名单计算 ] ---
  const globalUsedPrivateIps = [...vips.map((v: any) => v.virtual_ipaddress), ...servers.map((s: any) => s.serverip), ...servers.map((s: any) => s.lip)].filter(Boolean) as string[];
  const globalUsedPublicIps = [...servers.map((s: any) => s.wip)].filter(Boolean) as string[];"""
text = text.replace(bad_block, '')

bad_block2 = """
  // --- [ 全局互斥占用黑名单计算 ] ---
  const globalUsedPrivateIps = [...vips.map((v: any) => v.virtual_ipaddress), ...servers.map((s: any) => s.serverip), ...servers.map((s: any) => s.lip)].filter(Boolean) as string[];
  const globalUsedPublicIps = [...servers.map((s: any) => s.wip)].filter(Boolean) as string[];
"""
text = text.replace(bad_block2, '')

# 用正则暴力清理掉任何带有 globalUsedPrivateIps 的全局单独定义（不在参数调用的地方）
text = re.sub(
    r'\s*// --- \[ 全局互斥占用黑名单计算 \] ---\s*const globalUsedPrivateIps = [^\n]+;\s*const globalUsedPublicIps = [^\n]+;',
    '',
    text
)


# 2. 注入到 `const [searchQuery, setSearchQuery]` 这种所有 state 之后的统一区域
# 既然 515 附近是最后一个 useState，我先定位到 `const fetchCurrentUser = ` 这种往往挂接在 state 后面的函数
target = "const fetchCurrentUser = async () => {"

if target in text:
    replacement = """
  // --- [ 全局互斥派生状态池 ] ---
  // 此时所有必需的依赖 state（vips, servers）必已完成声明并初始化完毕，不再受 TDZ 限制
  const globalUsedPrivateIps = [...vips.map((v: any) => v.virtual_ipaddress), ...servers.map((s: any) => s.serverip), ...servers.map((s: any) => s.lip)].filter(Boolean) as string[];
  const globalUsedPublicIps = [...servers.map((s: any) => s.wip)].filter(Boolean) as string[];

  """ + target
    text = text.replace(target, replacement)
    with open('src/app/page.tsx', 'w') as f:
        f.write(text)
    print("变量安全挂载成功！放置在方法群之前，完全避开TDZ")
else:
    print("WARN: 未找到 target 函数，脚本未应用改动")
