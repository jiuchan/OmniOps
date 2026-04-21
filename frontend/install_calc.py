with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 注入导入项
if "import IpCalculator" not in text:
    import_index = text.find('import {')
    if import_index != -1:
        text = text[:import_index] + "import IpCalculator from './IpCalculator';\n" + text[import_index:]

# 2. 注入 State
state_anchor = "const [isEipModalOpen, setIsEipModalOpen] = useState(false);"
if state_anchor in text and "isIpCalcOpen" not in text:
    text = text.replace(state_anchor, state_anchor + "\n  const [isIpCalcOpen, setIsIpCalcOpen] = useState(false);")

# 3. 注入按钮
button_anchor = "<span className=\"text-sm font-bold text-sky-400 pl-4\">{t('eips.title') || 'IP 资产全局调度盘'}</span>"
calc_btn = """<div className="flex items-center gap-4">
                 <span className="text-sm font-bold text-sky-400 pl-4">{t('eips.title') || 'IP 资产全局调度盘'}</span>
                 <button type="button" onClick={() => setIsIpCalcOpen(true)} className="text-[10px] bg-sky-900/40 text-sky-300 hover:bg-sky-500 hover:text-white px-2 py-1 rounded border border-sky-500/30 transition-colors flex items-center gap-1"><Calculator className="w-3 h-3" /> 掩码工具</button>
             </div>"""
if button_anchor in text:
    text = text.replace(button_anchor, calc_btn)

# 4. 注入渲染的 Modal 组件
render_anchor = "{isEipModalOpen && ("
calc_render = """{isIpCalcOpen && <IpCalculator onClose={() => setIsIpCalcOpen(false)} />}
      {isEipModalOpen && ("""
if render_anchor in text and "isIpCalcOpen && <IpCalculator" not in text:
    text = text.replace(render_anchor, calc_render)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)
print("计算器组件集成完毕")
