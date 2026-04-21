with open('src/app/page.tsx', 'r') as f:
    text = f.read()

# 1. 插在文件较上方的 helper 函数 (寻找 Pinyin Helper)
helper_anchor = "// --- [ Pinyin Helper for Datacenter Infra Codes ] ---"
helper_func = """// --- [ IP Subnet Helper ] ---
const ip2long = (ip: string) => ip.split('.').reduce((acc, val) => (acc << 8) + parseInt(val, 10), 0) >>> 0;
const long2ip = (long: number) => [long >>> 24, (long >> 16) & 255, (long >> 8) & 255, long & 255].join('.');

const getAvailableHostIps = (networks: any[], usedIps: string[], limit=60) => {
    let results: string[] = [];
    for (const net of networks) {
        if (!net.ip_address) continue;
        const [ipStr, prefixStr] = net.ip_address.split('/');
        const prefix = parseInt(prefixStr || "32", 10);
        if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;
        try {
            const ipLong = ip2long(ipStr);
            const maskLong = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
            const networkLong = (ipLong & maskLong) >>> 0;
            const broadcastLong = (networkLong | (~maskLong)) >>> 0;
            let start = prefix >= 31 ? networkLong : networkLong + 1;
            let end = prefix >= 31 ? broadcastLong : broadcastLong - 1;
            for (let i = start; i <= end; i++) {
                const hostIp = long2ip(i);
                if (!usedIps.includes(hostIp)) {
                    results.push(hostIp);
                    if (results.length >= limit) return results;
                }
            }
        } catch (e) {}
    }
    return results;
};

// --- [ Pinyin Helper for Datacenter Infra Codes ] ---"""

if "const getAvailableHostIps" not in text:
    text = text.replace(helper_anchor, helper_func)

# 2. 修改 Datalist
wip_m_old = """<datalist id="wip_master_list">
                                         {availablePublicIps.map((e: any) => <option key={`wip-m-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
wip_m_new = """<datalist id="wip_master_list">
                                         {getAvailableHostIps(availablePublicIps, servers.map(s => s.wip).concat(servers.map(s => s.serverip)) as string[]).map((ip: string) => <option key={`wip-m-${ip}`} value={ip} label={`未占用单机外网IP`} />)}
                                     </datalist>"""

lip_m_old = """<datalist id="lip_master_list">
                                         {availablePrivateIps.map((e: any) => <option key={`lip-m-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
lip_m_new = """<datalist id="lip_master_list">
                                         {getAvailableHostIps(availablePrivateIps, servers.map(s => s.lip).concat(servers.map(s => s.serverip)) as string[]).map((ip: string) => <option key={`lip-m-${ip}`} value={ip} label={`未占用单机内网IP`} />)}
                                     </datalist>"""

wip_b_old = """<datalist id="wip_backup_list">
                                         {availablePublicIps.map((e: any) => <option key={`wip-b-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
wip_b_new = """<datalist id="wip_backup_list">
                                         {getAvailableHostIps(availablePublicIps, servers.map(s => s.wip).concat(servers.map(s => s.serverip)) as string[]).map((ip: string) => <option key={`wip-b-${ip}`} value={ip} label={`未占用单机外网IP`} />)}
                                     </datalist>"""

lip_b_old = """<datalist id="lip_backup_list">
                                         {availablePrivateIps.map((e: any) => <option key={`lip-b-${e.id}`} value={e.ip_address.split('/')[0]} label={`掩码: ${e.ip_address}`} />)}
                                     </datalist>"""
lip_b_new = """<datalist id="lip_backup_list">
                                         {getAvailableHostIps(availablePrivateIps, servers.map(s => s.lip).concat(servers.map(s => s.serverip)) as string[]).map((ip: string) => <option key={`lip-b-${ip}`} value={ip} label={`未占用单机内网IP`} />)}
                                     </datalist>"""

text = text.replace(wip_m_old, wip_m_new)
text = text.replace(lip_m_old, lip_m_new)
text = text.replace(wip_b_old, wip_b_new)
text = text.replace(lip_b_old, lip_b_new)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)

print("完成对被占用 IPs 的过滤与展平！")
