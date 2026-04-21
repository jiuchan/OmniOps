import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 考虑到可能有细小的格式差异，这里用简单的搜索替换。
# 找到 disabled={!!editingEipId} 并删除
target = """                           <input 
                             disabled={!!editingEipId}
                             type="text" 
                             value={entry.ip_address}"""

replace = """                           <input 
                             type="text" 
                             value={entry.ip_address}"""

if target in text:
    text = text.replace(target, replace)
    with open('src/app/page.tsx', 'w') as f:
        f.write(text)
    print("已解锁 IP 资产编辑状态")
else:
    print("未找到需要解锁的目标代码，可能是格式有变")
