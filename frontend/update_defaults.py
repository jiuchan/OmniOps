import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 删除 VIP 和 RS 的全局选项
text = re.sub(r'<option value="">-- \[松散游离\] 暂不部署至物理通道 --</option>', '', text)
text = re.sub(r'<option value="">-- \[全域广域\] 不限定物理机柜搜索 --</option>', '', text)

# 2. 从 infraData 计算默认初始值
# 我们可以在 `const openVipModal = (vip?: any) => {` 这里和之前加入 firstCabId 计算
first_cab_calc = "const firstCabId = infraData[0]?.rooms?.[0]?.cabinets?.[0]?.id || null;\n"

# 3. 替换 VIP 的 null 初始化
vip_modal_regex = r'(setVipFormData\(\{[\s\S]*?target_cabinet_id: )null(\s*\}\);)'
text = re.sub(vip_modal_regex, r'\1firstCabId\2', text)
text = text.replace('const openVipModal = (vip?: any) => {', 'const openVipModal = (vip?: any) => {\n     ' + first_cab_calc)

# 4. 给 RS 表单追加相同的逻辑
# 找到 `const openServerModal = ` 这段 （因为上面看到大约在 280 行之前），其实可以用更灵活的定位
# 先找出 `const openServerModal = (server?: any) => {`
text = text.replace('const openServerModal = (server?: any) => {', 'const openServerModal = (server?: any) => {\n    ' + first_cab_calc)

# 然后把 Server 的 null 替换或追加进去，在 RS default formData 里
# `setServerFormData({\n        servername: "APP-Node",` 这种地方
def replace_server_form(match):
    return match.group(0) + "target_cabinet_id: firstCabId,\n        "

text = re.sub(r'(setServerFormData\(\{\s*)servername:', replace_server_form, text)

# 为了 TypeScript ，在 `const [serverFormData, setServerFormData] = useState({` 这里也加上初始字段声明
def replace_server_state(match):
    return match.group(0) + " target_cabinet_id: null as number | null,"

text = re.sub(r'(const \[serverFormData, setServerFormData\] = useState\(\{)', replace_server_state, text)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("移除了全局无机柜选项，并设置了首个机柜作为绑定和筛选的默认值。")
