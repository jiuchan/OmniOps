import re

with open('src/app/page.tsx', 'r') as f:
    text = f.read()

old_func = """const getAvailableHostIps = (networks: any[], usedIps: string[], limit=60) => {
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
};"""

new_func = """const getAvailableHostIps = (networks: any[], usedIps: string[], limit=60) => {
    let results: string[] = [];
    for (const net of networks) {
        if (!net.ip_address) continue;
        
        try {
            let start: number, end: number;
            
            if (net.ip_address.includes('-')) {
                // 兼容区间格式 (e.g. 192.168.1.100-192.168.1.150)
                const [startStr, endStr] = net.ip_address.split('-');
                start = ip2long(startStr.trim());
                end = ip2long(endStr.trim());
            } else {
                // 标准 CIDR 格式
                const [ipStr, prefixStr] = net.ip_address.split('/');
                const prefix = parseInt(prefixStr || "32", 10);
                if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;
                
                const ipLong = ip2long(ipStr.trim());
                const maskLong = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
                const networkLong = (ipLong & maskLong) >>> 0;
                const broadcastLong = (networkLong | (~maskLong)) >>> 0;
                
                start = prefix >= 31 ? networkLong : networkLong + 1;
                end = prefix >= 31 ? broadcastLong : broadcastLong - 1;
            }

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
};"""

text = text.replace(old_func, new_func)

with open('src/app/page.tsx', 'w') as f:
    f.write(text)
print("兼容区间格式展平完成！")
