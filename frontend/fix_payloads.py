import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# --- VIP ---
vip_block_old = """    try {
      if (editingVipId) {
         // 单节点接管更新 (PUT)
         const payload = {
             ...vipFormData,
             wan_ip: vipFormData.wan_ips_input || undefined
         };
         
         const res = await fetch(`http://localhost:8000/api/vips/${editingVipId}`, {"""

vip_block_new = """    try {
      const { target_cabinet_id, wan_ips_input, ...cleanVipData } = vipFormData;
      const basePayload = {
         ...cleanVipData,
         wan_ip: wan_ips_input || undefined
      };

      if (editingVipId) {
         // 单节点接管更新 (PUT)
         const res = await fetch(`http://localhost:8000/api/vips/${editingVipId}`, {"""

vip_post_old = """      } else {
         // 单点新建模式 (POST)
         const payload = {
             ...vipFormData
         };
         
         const res = await fetch("http://localhost:8000/api/vips/", {"""

vip_post_new = """      } else {
         // 单点新建模式 (POST)
         const res = await fetch("http://localhost:8000/api/vips/", {"""

# 执行 VIP 的替换
if vip_block_old in text:
    text = text.replace(vip_block_old, vip_block_new)
    # 因为 POST 这里使用了 body: JSON.stringify(payload)，我们需要改成 basePayload
    text = text.replace(vip_post_old, vip_post_new)
    text = re.sub(r'(const res = await fetch\("http://localhost:8000/api/vips/", \{\s*method: "POST",\s*headers: .*?,\s*body: JSON\.stringify\()payload(\)\s*\});)', r'\1basePayload\2', text)
else:
    print("WARNING: vip_block_old not found!")

# --- Server ---
server_block_old = """    try {
      if (editingServerId) {
         // 单点接管更新模式 (PUT)
         const res = await fetch(`http://localhost:8000/api/servers/${editingServerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(serverFormData)"""

server_block_new = """    try {
      const { target_cabinet_id, target_vip_id, ...cleanServerData } = serverFormData;
      if (editingServerId) {
         // 单点接管更新模式 (PUT)
         const res = await fetch(`http://localhost:8000/api/servers/${editingServerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cleanServerData)"""

server_post_old = """         const reqs = ips.map(async (ip, idx) => {
             const suffix = ips.length > 1 ? `-${idx+1}` : "";
             const payload = { ...serverFormData, serverip: ip, servername: serverFormData.servername + suffix };"""

server_post_new = """         const reqs = ips.map(async (ip, idx) => {
             const suffix = ips.length > 1 ? `-${idx+1}` : "";
             const payload = { ...cleanServerData, serverip: ip, servername: cleanServerData.servername + suffix };"""

if server_block_old in text:
    text = text.replace(server_block_old, server_block_new)
    text = text.replace(server_post_old, server_post_new)
else:
    print("WARNING: server_block_old not found!")

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("修复了 Payload 中的意外防线字段。")
