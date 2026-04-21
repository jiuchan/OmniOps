import React, { useState } from 'react';
import { X, Network, Calculator, ChevronRight, Binary } from 'lucide-react';

interface IpCalculatorProps {
  onClose: () => void;
}

const ip2long = (ip: string) => 
  ip.split('.').reduce((acc, val) => (acc << 8) + parseInt(val, 10), 0) >>> 0;

const long2ip = (long: number) => 
  [long >>> 24, (long >> 16) & 255, (long >> 8) & 255, long & 255].join('.');

export default function IpCalculator({ onClose }: IpCalculatorProps) {
  const [inputCidr, setInputCidr] = useState("192.168.1.0/24");
  const [splitPrefix, setSplitPrefix] = useState<number | "">("");

  let error = "";
  let netCidr = "";
  let netMask = "";
  let firstIp = "";
  let lastIp = "";
  let broadcast = "";
  let totalHosts = 0;
  let splitSubnets: string[] = [];

  try {
    const [ipStr, prefixStr] = inputCidr.split('/');
    if (!ipStr || !prefixStr) throw new Error("Format should be IP/Prefix (e.g. 10.0.0.0/24)");
    
    let prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error("Prefix must be 0 - 32");

    // Check basic IP format
    const parts = ipStr.split('.');
    if (parts.length !== 4 || parts.some(p => isNaN(parseInt(p, 10)) || parseInt(p, 10) < 0 || parseInt(p, 10) > 255)) {
      throw new Error("Invalid IP address format");
    }

    const ipLong = ip2long(ipStr);
    const maskLong = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const networkLong = (ipLong & maskLong) >>> 0;
    const broadcastLong = (networkLong | (~maskLong)) >>> 0;

    netCidr = `${long2ip(networkLong)}/${prefix}`;
    netMask = long2ip(maskLong);
    
    if (prefix === 32) {
      firstIp = long2ip(networkLong);
      lastIp = long2ip(networkLong);
      totalHosts = 1;
      broadcast = "-";
    } else if (prefix === 31) {
      firstIp = long2ip(networkLong);
      lastIp = long2ip(broadcastLong);
      totalHosts = 2;
      broadcast = "255.255.255.255";
    } else {
      firstIp = long2ip(networkLong + 1);
      lastIp = long2ip(broadcastLong - 1);
      broadcast = long2ip(broadcastLong);
      totalHosts = (broadcastLong - 1) - (networkLong + 1) + 1;
    }

    if (splitPrefix && typeof splitPrefix === 'number' && splitPrefix > prefix && splitPrefix <= 32) {
      const step = 1 << (32 - splitPrefix);
      const numSubnets = 1 << (splitPrefix - prefix);
      // Limit presentation for UI performance
      const limit = Math.min(numSubnets, 1024);
      for (let i = 0; i < limit; i++) {
         splitSubnets.push(`${long2ip(networkLong + i * step)}/${splitPrefix}`);
      }
      if (numSubnets > 1024) splitSubnets.push(`... (+ ${numSubnets - 1024} more)`);
    }

  } catch (err: any) {
    error = err.message || "Invalid CIDR";
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-950 border border-sky-500/30 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl shadow-sky-900/20 flex flex-col max-h-[90vh]">
         <div className="border-b border-neutral-800 p-5 flex justify-between items-center bg-neutral-900/50">
            <h3 className="text-xl font-bold text-sky-400 flex items-center gap-2">
              <Calculator className="w-5 h-5"/> IP 掩码与网络拆分计算器
            </h3>
            <button type="button" onClick={onClose} className="text-neutral-500 hover:text-sky-300">
              <X className="w-5 h-5" />
            </button>
         </div>

         <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-neutral-900 p-5 rounded-xl border border-sky-900/30">
               <label className="text-sm font-bold text-sky-500 mb-2 block">输入目标网络或 IP (CIDR 格式)</label>
               <input 
                 type="text" 
                 value={inputCidr} 
                 onChange={e => setInputCidr(e.target.value)} 
                 className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-lg text-sky-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500/50 font-mono tracking-wider"
                 placeholder="e.g. 192.168.1.0/24"
               />
               {error && <p className="text-red-400 text-xs mt-2 font-mono">⚠️ {error}</p>}
            </div>

            {!error && (
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-neutral-900/50 p-4 rounded-lg flex flex-col gap-1 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">标准网络地址 (CIDR)</span>
                    <span className="text-emerald-400 font-mono font-bold text-lg">{netCidr}</span>
                 </div>
                 <div className="bg-neutral-900/50 p-4 rounded-lg flex flex-col gap-1 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">子网掩码 (Subnet Mask)</span>
                    <span className="text-neutral-200 font-mono font-bold text-lg">{netMask}</span>
                 </div>
                 <div className="bg-neutral-900/50 p-4 rounded-lg flex flex-col gap-1 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">可用 IP 范围 (Range)</span>
                    <span className="text-sky-300 font-mono text-sm">{firstIp} - {lastIp}</span>
                 </div>
                 <div className="bg-neutral-900/50 p-4 rounded-lg flex flex-col gap-1 border border-neutral-800">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">网段容量 (Usable Hosts) / 广播</span>
                    <span className="text-purple-300 font-mono text-sm">{totalHosts} 台 <span className="text-neutral-500 ml-2">({broadcast})</span></span>
                 </div>
               </div>
            )}

            {!error && (
               <div className="border-t border-sky-900/30 pt-6">
                 <label className="text-sm font-bold text-sky-500 mb-2 flex items-center gap-2">
                   <Binary className="w-4 h-4"/> 快速子网拆分 (Subnetting)
                 </label>
                 <div className="flex gap-4 items-center">
                    <span className="text-neutral-400 text-sm">将当前网段横向切割至：</span>
                    <select 
                       value={splitPrefix} 
                       onChange={e => setSplitPrefix(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
                       className="bg-black border border-neutral-800 text-sky-300 rounded px-3 py-1.5 focus:outline-none focus:border-sky-500/50 font-mono"
                    >
                       <option value="">-- 选择目标掩码 --</option>
                       {Array.from({length: 32 - parseInt(inputCidr.split('/')[1] || "32", 10)}).map((_, i) => {
                          const val = parseInt(inputCidr.split('/')[1] || "32", 10) + i + 1;
                          return <option key={val} value={val}>/{val}</option>;
                       })}
                    </select>
                 </div>
                 
                 {splitSubnets.length > 0 && (
                     <div className="mt-4 p-3 bg-black rounded-lg border border-neutral-800 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
                           {splitSubnets.map((sub, idx) => (
                              <div key={idx} className="flex items-center gap-2 font-mono text-xs text-neutral-300 border-b border-neutral-800 pb-1">
                                <ChevronRight className="w-3 h-3 text-sky-700"/> {sub}
                              </div>
                           ))}
                        </div>
                     </div>
                 )}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
