with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 我们将插入这块独立的提前截流处理 cabinet 提交的代码
insert_code = """
    if (infraModalType === "cabinet") {
      try {
        const authHeader = { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` };
        for (const cab of infraFormData.cabinets) {
           if (!cab.name || !cab.code) continue;
           const cabResp = await fetch("http://localhost:8000/api/infra/cabinet", {
               method: "POST", headers: authHeader,
               body: JSON.stringify({ name: cab.name, code: cab.code, room_id: infraFormData.parent_id })
           });
           if (!cabResp.ok) {
             const err = await cabResp.json().catch(() => ({}));
             console.error("机柜阵列构建失败", err);
           }
        }
        setIsInfraModalOpen(false);
        loadData();
      } catch (err: any) {
        alert("多机柜创建失败: " + (err.message || err));
      } finally {
        setSubmitting(false);
      }
      return;
    }
"""

# 在 full_chain 处理完成后的 return; 后面插入
if '    let endpoint = "";' in text:
    text = text.replace('    let endpoint = "";', insert_code + '\n    let endpoint = "";')

# 同时，把下面原本用来处理 cabinet 的遗留 else if 删除
target_to_remove = """    } else if (infraModalType === "cabinet") {
      endpoint = "/api/infra/cabinet";
      payload.room_id = infraFormData.parent_id;"""
      
text = text.replace(target_to_remove, "")

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("独立的机柜批量提交修补完成")
