import React, { useEffect } from 'react';
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

  return (
    <div className="w-full h-full bg-slate-950 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          if (node.id.startsWith('node-widget-')) {
            const wId = node.id.replace('node-widget-', '');
            onSelectWidget(wId);
          }
        }}
        nodesDraggable={true}
        fitView
      >
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
