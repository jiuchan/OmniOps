"use client";

import React, { useEffect } from 'react';
import { ReactFlow, Controls, Background, useNodesState, useEdgesState, BackgroundVariant, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Server, Globe, HardDrive } from 'lucide-react';

const DatacenterNode = ({ data }: any) => (
  <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-4 w-52 shadow-lg shadow-emerald-900/20 backdrop-blur-md">
    <div className="font-bold text-emerald-400 flex items-center gap-2 text-sm"><Server className="w-4 h-4"/> [Core] {data.label}</div>
    <div className="text-xs text-neutral-400 mt-2 font-mono flex gap-2 items-center">
      <span className="w-2 h-2 rounded-full border border-neutral-700 bg-emerald-500"></span>
      {data.wip}
    </div>
    <div className="absolute -top-3 -right-2 text-[10px] font-bold bg-emerald-500 text-black px-2 py-0.5 rounded shadow-lg shadow-emerald-900">{data.state}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-black !bg-emerald-400 translate-y-1.5" />
  </div>
);

const VipNode = ({ data }: any) => (
  <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-4 w-48 shadow-lg shadow-cyan-900/20 backdrop-blur-md">
    <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-black !bg-emerald-400 -translate-y-1.5" />
    <div className="font-bold text-cyan-400 flex items-center gap-2 text-sm"><Globe className="w-4 h-4"/> {data.label}</div>
    <div className="text-xs text-neutral-400 mt-2 bg-black/40 px-2 py-1 rounded inline-block border border-neutral-800">{data.app}</div>
    <div className="text-[10px] bg-cyan-900/80 text-cyan-200 mt-2 px-1.5 py-0.5 rounded ml-2 inline-block border border-cyan-700/50">{data.algo}</div>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-black !bg-amber-400 translate-y-1.5" />
  </div>
);

const ServerNode = ({ data }: any) => (
  <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 w-40 shadow-lg shadow-amber-900/20 backdrop-blur-md">
    <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-black !bg-amber-400 -translate-y-1.5" />
    <div className="font-bold text-amber-400 flex items-center gap-2 text-sm"><HardDrive className="w-3 h-3"/> {data.label}</div>
    <div className="text-[10px] text-neutral-400 mt-1 font-mono tracking-tighter">{data.ip}</div>
    <div className="absolute top-3 right-3 w-2 h-2 rounded-full border border-black shadow" style={{backgroundColor: data.status === 'ON' ? '#10b981' : '#ef4444'}}></div>
  </div>
);

const nodeTypes = {
  datacenterNode: DatacenterNode,
  vipNode: VipNode,
  serverNode: ServerNode,
};

export default function NetworkGraph() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/topology/')
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(data => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      })
      .catch(err => {
        console.error("Topology Sync Error:", err);
        setErrorMsg(err.message);
      });
  }, []);

  return (
    <div className="w-full h-[650px] border border-neutral-800 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#111] relative shadow-inner">
      <div className="absolute top-5 left-5 z-10 flex gap-2 shadow-lg shadow-black/50">
         <span className="px-3 py-1.5 bg-neutral-900/80 border border-neutral-700 rounded-full text-xs text-neutral-300 flex items-center gap-2 font-mono backdrop-blur">
            <span className={`w-2 h-2 rounded-full ${errorMsg ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-emerald-500 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_#10b981]'}`}></span>
            {errorMsg ? `拓扑数据加载失败：${errorMsg}` : "拓扑数据连接中..."}
         </span>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#333" className="opacity-70" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
