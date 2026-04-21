import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 插入 ChevronDown 导入
if 'ChevronDown' not in text:
    text = text.replace('ChevronRight } from "lucide-react";', 'ChevronRight, ChevronDown } from "lucide-react";')

# 2. 插入状态
if 'const [expandedDcs' not in text:
    insert_point = text.find('export default function Home() {')
    if insert_point != -1:
        start = insert_point + len('export default function Home() {')
        inserted_code = """
  const [expandedDcs, setExpandedDcs] = useState<number[]>([]);
  const toggleDc = (id: number) => { setExpandedDcs(prev => prev.includes(id) ? prev.filter(dcId => dcId !== id) : [...prev, id]); };
"""
        text = text[:start] + inserted_code + text[start:]

# 3. 替换 H3 标签和添加 toggle
h3_target = """<h3 className="font-bold text-2xl text-neutral-200 flex items-center gap-3 font-mono uppercase tracking-wide">
                            <span className="w-3 h-3 bg-indigo-500 ml-1"></span>"""
h3_replace = """<h3 className="font-bold text-2xl text-neutral-200 flex items-center gap-3 font-mono uppercase tracking-wide cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => toggleDc(dc.id)}>
                            {expandedDcs.includes(dc.id) ? <ChevronDown className="w-6 h-6 text-indigo-500" /> : <ChevronRight className="w-6 h-6 text-indigo-500" />}"""
text = text.replace(h3_target, h3_replace)

# 4. 包裹 Rooms Array
# 寻找 Rooms Array 容器
rooms_container_target = """{/* Rooms Array */}
                       <div className="flex flex-col gap-8">"""
rooms_container_replace = """{/* Rooms Array */}
                       {expandedDcs.includes(dc.id) && (
                       <div className="flex flex-col gap-8">"""
text = text.replace(rooms_container_target, rooms_container_replace)

# 5. 为了闭合 {expandedDcs.includes(dc.id) && (，我们需要找到它的结束位置
# 匹配这段:
#                          ) : (
#                               <p className="text-sm text-neutral-600 italic">尚未开拓机房子域</p>
#                          )}
#                       </div>
#                     </div>
end_target = """                          ) : (
                               <p className="text-sm text-neutral-600 italic">尚未开拓机房子域</p>
                          )}
                       </div>
                     </div>"""
end_replace = """                          ) : (
                               <p className="text-sm text-neutral-600 italic">尚未开拓机房子域</p>
                          )}
                       </div>
                       )}
                     </div>"""
text = text.replace(end_target, end_replace)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("逻辑替换完成")
