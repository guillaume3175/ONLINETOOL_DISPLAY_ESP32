import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface CustomNodeData {
  label: string;
  type?: string;
  subtitle?: string;
  badge?: string;
  isContainer?: boolean;
}

export const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as unknown as CustomNodeData;
  const isContainer = nodeData.isContainer;

  return (
    <div
      className={`rounded-lg transition-all shadow-lg ${
        selected
          ? 'ring-2 ring-sky-400 border-sky-400 bg-slate-900 shadow-sky-500/20'
          : isContainer
          ? 'border border-indigo-500/60 bg-slate-900/90 text-indigo-200 hover:border-indigo-400'
          : 'border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500'
      }`}
      style={{ width: 220, minHeight: 64 }}
    >
      {/* Target handle (Input) */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-slate-800 !border-2 !border-sky-400 hover:scale-125 transition-transform"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-950/50 rounded-t-lg">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span
            className={`w-2 h-2 rounded-full ${
              isContainer ? 'bg-indigo-400' : 'bg-sky-400'
            }`}
          />
          <span className="text-[11px] font-bold tracking-wide uppercase truncate text-slate-300">
            {nodeData.type || 'NODE'}
          </span>
        </div>
        {nodeData.badge && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            {nodeData.badge}
          </span>
        )}
      </div>

      {/* Node Content Body */}
      <div className="px-3 py-2 text-xs font-semibold text-slate-100 truncate">
        {nodeData.label}
        {nodeData.subtitle && (
          <div className="text-[10px] font-normal text-slate-400 truncate mt-0.5">
            {nodeData.subtitle}
          </div>
        )}
      </div>

      {/* Source handle (Output) */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-slate-800 !border-2 !border-emerald-400 hover:scale-125 transition-transform"
      />
    </div>
  );
};
