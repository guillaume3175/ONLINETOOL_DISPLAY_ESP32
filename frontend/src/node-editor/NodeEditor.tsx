import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Esp32Project, LvglWidget } from '@esp32-designer/shared';

interface NodeEditorProps {
  project: Esp32Project;
  onSelectWidget: (widgetId: string) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ project, onSelectWidget }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightDependencies, setHighlightDependencies] = useState<boolean>(true);
  const [hideUnconnected, setHideUnconnected] = useState<boolean>(false);

  // Compute upstream/downstream dependencies whenever selectedNodeId or edges change
  const dependencyInfo = useMemo(() => {
    if (!selectedNodeId) {
      return { upstreamNodes: new Set<string>(), downstreamNodes: new Set<string>(), connectedEdges: new Set<string>() };
    }

    const upstreamNodes = new Set<string>();
    const downstreamNodes = new Set<string>();
    const connectedEdges = new Set<string>();

    // Helper for finding upstream (ancestors)
    const findUpstream = (nodeId: string) => {
      edges.forEach((e) => {
        if (e.target === nodeId) {
          upstreamNodes.add(e.source);
          connectedEdges.add(e.id);
          findUpstream(e.source);
        }
      });
    };

    // Helper for finding downstream (descendants)
    const findDownstream = (nodeId: string) => {
      edges.forEach((e) => {
        if (e.source === nodeId) {
          downstreamNodes.add(e.target);
          connectedEdges.add(e.id);
          findDownstream(e.target);
        }
      });
    };

    findUpstream(selectedNodeId);
    findDownstream(selectedNodeId);

    return { upstreamNodes, downstreamNodes, connectedEdges };
  }, [selectedNodeId, edges]);

  useEffect(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // Group 1: Hardware Group
    initialNodes.push({
      id: 'group-hardware',
      position: { x: 40, y: 40 },
      data: { label: 'HARDWARE LAYER' },
      style: {
        width: 320,
        height: 280,
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        border: '1px dashed #3b82f6',
        borderRadius: '12px',
        color: '#94a3b8',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '10px'
      }
    });

    // Board Node inside Hardware Group
    initialNodes.push({
      id: 'node-board',
      parentId: 'group-hardware',
      extent: 'parent',
      position: { x: 20, y: 40 },
      data: { label: `ESP32 (${project.board.board || 'DevKit'})` },
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px', width: 280 }
    });

    // Display Node inside Hardware Group
    initialNodes.push({
      id: 'node-display',
      parentId: 'group-hardware',
      extent: 'parent',
      position: { x: 20, y: 110 },
      data: { label: `Display (${project.display.driver} - ${project.display.width}x${project.display.height})` },
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #10b981', borderRadius: '8px', padding: '10px', width: 280 }
    });
    initialEdges.push({ id: 'e-board-display', source: 'node-board', target: 'node-display', animated: true });

    // Touch Node inside Hardware Group
    if (project.touchscreen) {
      initialNodes.push({
        id: 'node-touch',
        parentId: 'group-hardware',
        extent: 'parent',
        position: { x: 20, y: 180 },
        data: { label: `Touch (${project.touchscreen.driver})` },
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px', width: 280 }
      });
      initialEdges.push({ id: 'e-board-touch', source: 'node-board', target: 'node-touch', animated: true });
    }

    // Group 2: LVGL Root Screen Group
    initialNodes.push({
      id: 'group-lvgl',
      position: { x: 400, y: 40 },
      data: { label: 'LVGL UI LAYER' },
      style: {
        width: 300,
        height: 120,
        backgroundColor: 'rgba(49, 46, 129, 0.3)',
        border: '1px dashed #6366f1',
        borderRadius: '12px',
        color: '#a5b4fc',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '10px'
      }
    });

    initialNodes.push({
      id: 'node-lvgl-root',
      parentId: 'group-lvgl',
      extent: 'parent',
      position: { x: 20, y: 40 },
      data: { label: 'LVGL Screen Canvas' },
      style: { background: '#312e81', color: '#e0e7ff', border: '1px solid #6366f1', borderRadius: '8px', padding: '10px', width: 260 }
    });
    initialEdges.push({ id: 'e-display-lvgl', source: 'node-display', target: 'node-lvgl-root' });

    // Group 3: Widgets & Tiles Stacked Hierarchy
    let yCounters: Record<number, number> = {};

    function addWidgetNodes(widget: LvglWidget, parentNodeId: string, level: number) {
      const levelX = 740 + level * 260;
      yCounters[level] = (yCounters[level] || 0) + 1;
      const levelY = yCounters[level] * 80;

      const widgetNodeId = `node-widget-${widget.id}`;
      const isContainer = widget.type === 'tileview' || widget.type === 'container' || widget.type === 'tile' || widget.type === 'tiles' || widget.type === 'obj';

      initialNodes.push({
        id: widgetNodeId,
        position: { x: levelX, y: levelY },
        data: { label: `${widget.type.toUpperCase()}: ${widget.id}` },
        style: {
          background: isContainer ? '#1e1b4b' : '#0f172a',
          color: isContainer ? '#818cf8' : '#cbd5e1',
          border: isContainer ? '1.5px solid #6366f1' : '1px solid #475569',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          width: 220
        }
      });

      initialEdges.push({
        id: `e-${parentNodeId}-${widget.id}`,
        source: parentNodeId,
        target: widgetNodeId
      });

      if (widget.children && widget.children.length > 0) {
        widget.children.forEach((child) => {
          addWidgetNodes(child, widgetNodeId, level + 1);
        });
      }
    }

    project.lvgl.widgets.forEach((widget) => {
      addWidgetNodes(widget, 'node-lvgl-root', 0);
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [project, setNodes, setEdges]);

  // Apply visual styling based on selection, dependency highlighting, and hideUnconnected toggle
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.id.startsWith('group-')) {
        return node; // don't hide or recolor outer group containers
      }

      const isSelected = node.id === selectedNodeId;
      const isUpstream = dependencyInfo.upstreamNodes.has(node.id);
      const isDownstream = dependencyInfo.downstreamNodes.has(node.id);
      const isConnected = isSelected || isUpstream || isDownstream;

      let hidden = false;
      if (selectedNodeId && hideUnconnected && !isConnected) {
        hidden = true;
      }

      let customStyle = { ...node.style };

      if (selectedNodeId && highlightDependencies) {
        if (isSelected) {
          customStyle = {
            ...customStyle,
            border: '2px solid #38bdf8',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)',
            background: '#0284c7',
            color: '#ffffff'
          };
        } else if (isUpstream) {
          // Upstream dependencies (parents / sources) - Orange / Coral
          customStyle = {
            ...customStyle,
            border: '2px solid #f97316',
            boxShadow: '0 0 10px rgba(249, 115, 22, 0.4)',
            background: '#7c2d12',
            color: '#ffedd5'
          };
        } else if (isDownstream) {
          // Downstream dependencies (children / targets) - Emerald Green
          customStyle = {
            ...customStyle,
            border: '2px solid #10b981',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
            background: '#064e3b',
            color: '#d1fae5'
          };
        } else {
          // Unconnected dimmed node
          customStyle = {
            ...customStyle,
            opacity: 0.35,
            filter: 'grayscale(60%)'
          };
        }
      }

      return {
        ...node,
        hidden,
        style: customStyle
      };
    });
  }, [nodes, selectedNodeId, dependencyInfo, highlightDependencies, hideUnconnected]);

  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnected = dependencyInfo.connectedEdges.has(edge.id);

      let hidden = false;
      if (selectedNodeId && hideUnconnected && !isConnected) {
        hidden = true;
      }

      let style = { ...edge.style };
      let animated = edge.animated;

      if (selectedNodeId && highlightDependencies) {
        if (isConnected) {
          style = { stroke: '#38bdf8', strokeWidth: 2.5 };
          animated = true;
        } else {
          style = { stroke: '#334155', strokeWidth: 1, opacity: 0.2 };
        }
      }

      return {
        ...edge,
        hidden,
        animated,
        style
      };
    });
  }, [edges, selectedNodeId, dependencyInfo, highlightDependencies, hideUnconnected]);

  return (
    <div className="w-full h-full bg-slate-950 relative">
      {/* Dependency Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-xl flex flex-col gap-2 text-xs text-slate-200 backdrop-blur-sm">
        <div className="font-semibold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span>Dependency Options</span>
          {selectedNodeId && (
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 underline ml-2"
            >
              Clear Selection
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={highlightDependencies}
            onChange={(e) => setHighlightDependencies(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          <span>Highlight Up / Down Dependencies</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={hideUnconnected}
            onChange={(e) => setHideUnconnected(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
          />
          <span>Hide Unconnected Nodes</span>
        </label>

        {selectedNodeId && highlightDependencies && (
          <div className="mt-1 pt-2 border-t border-slate-800 flex flex-col gap-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              Selected Node
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
              Upstream Parent (Sources)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Downstream Child (Targets)
            </div>
          </div>
        )}
      </div>

      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          if (node.id.startsWith('node-widget-')) {
            const wId = node.id.replace('node-widget-', '');
            onSelectWidget(wId);
          }
        }}
        onPaneClick={() => setSelectedNodeId(null)}
        nodesDraggable={true}
        fitView
      >
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
