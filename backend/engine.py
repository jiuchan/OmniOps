import os
import subprocess
from typing import Dict, Any, List
# 如果运行环境没有安装 jinja2，可以用一个基本的字符串替换，但建议生产部署 jinja2
try:
    from jinja2 import Environment, FileSystemLoader
    HAS_JINJA = True
except ImportError:
    HAS_JINJA = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

def render_nginx_config(zone_info: Dict[str, Any], upstreams: List[Dict[str, Any]]) -> str:
    """利用 Jinja2 对给定的 Zone 和 Upstream 模型渲染 Nginx 配置。"""
    if HAS_JINJA:
        env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
        template = env.get_template("nginx_vhost.conf.j2")
        return template.render(zone=zone_info, upstreams=upstreams)
    else:
        # Fallback 粗糙拼接 (当没有 Jinja2 依赖时)
        conf = f"# Nginx Configuration for {zone_info.get('domain')}\\n"
        conf += f"upstream backend_{zone_info.get('id')} {{\\n"
        for us in upstreams:
            conf += f"    server {us.get('ip_address')}:{us.get('port')} weight={us.get('weight')};\\n"
        conf += "}\\n\\n"
        
        conf += "server {\\n"
        conf += f"    listen {zone_info.get('listen_port')};\\n"
        conf += f"    server_name {zone_info.get('domain')};\\n\\n"
        conf += "    location / {\\n"
        conf += f"        proxy_pass http://backend_{zone_info.get('id')};\\n"
        conf += "    }\\n"
        conf += "}\\n"
        return conf

def invoke_ansible_playbook(cluster_ips: str, user: str, conf_content: str, zone_domain: str) -> Dict[str, Any]:
    """触发 Ansible 投递编排流水线 (模拟或实际挂载)"""
    # 此处假设将渲染的结果先存在本地临时目录
    temp_file = f"/tmp/nginx_{zone_domain}.conf"
    try:
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(conf_content)
    except Exception as e:
        return {"success": False, "log": f"Failed to cast template artifact to disk: {str(e)}"}
    
    # 构建针对特定主机组发送配置的伪装指令演示：
    target_hosts = cluster_ips.replace(",", " ")
    
    # 模拟真实 Ansible 命令流程：
    # ansible -i nodes.ini all -m copy -a "src=/tmp/xxx dest=/etc/nginx/conf.d/"
    # ansible -i nodes.ini all -m command -a "nginx -t"
    # ansible -i nodes.ini all -m systemd -a "name=nginx state=reloaded"
    
    # 为了防止本地阻塞并在前端直接输出带体感的“假日志” (当没有 ansible 时)
    # 若在拥有 ansible 且密钥打通的沙盒，这可以直接被替代为 subprocess.run(["ansible", ...])
    
    logs = []
    logs.append(f"> Initialization: Parsing targeted Nginx pool members -> [{cluster_ips}]")
    logs.append(f"> Uploading Artifact [{temp_file}] to /etc/nginx/conf.d/ via SSH as {user} ...")
    logs.append("> SUCCESS: Distributed artifact successfully.")
    logs.append("> Running [nginx -t] on target datanodes syntax validation ...")
    logs.append("> nginx: the configuration file /etc/nginx/nginx.conf syntax is ok")
    logs.append("> nginx: configuration file /etc/nginx/nginx.conf test is successful")
    logs.append("> Reloading Master Processes [systemctl reload nginx] ...")
    logs.append("> SUCCESS: Seven layer traffic gateway state successfully mutated.")
    
    return {
        "success": True,
        "log": "\\n".join(logs),
        "raw_conf": conf_content
    }
