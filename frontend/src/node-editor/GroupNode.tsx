import React from 'react';
import { NodeProps } from '@xyflow/react';

export interface GroupNodeData {
  title: string;
  nodeCount: number;
  width: number;
  height: number;
}

export const GroupNode: React.FC<NodeProps> = ({ data, selected }) => {
  const groupData = data as unknown as GroupNodeData;

  return (
    <div
      className={`rounded-xl transition-all pointer-events-none ${
        selected
          ? 'border-2 border-indigo-400/80 bg-indigo-950/20 shadow-indigo-500/10'
          : 'border border-dashed border-indigo-500/30 bg-slate-900/30'
      }`}
      style={{
        width: groupData.width,
        height: groupData.height
      }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-indigo-500/20 bg-indigo-950/40 rounded-t-xl text-indigo-300 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400/80 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
            {groupData.title}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 font-mono border border-indigo-700/40">
          {groupData.nodeCount} {groupData.nodeCount === 1 ? 'node' : 'nodes'}
        </span>
      </div>
    </div>
  );
};
