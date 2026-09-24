import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Esp32Project, LvglWidget } from '@esp32-designer/shared';

interface NodeEditorProps {
  project: Esp32Project;
  onSelectWidget: (widgetId: string) => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ project, onSelectWidget }) => {
  const { nodes, edges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    nodesList.push({
      id: 'node-board',
      position: { x: 50, y: 150 },
      data: { label: `ESP32 (${project.board.board || 'DevKit'})` },
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: '8px', padding: '10px' }
    });

    nodesList.push({
      id: 'node-display',
      position: { x: 250, y: 80 },
      data: { label: `Display (${project.display.width}x${project.display.height})` },
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #10b981', borderRadius: '8px', padding: '10px' }
    });
    edgesList.push({ id: 'e-board-display', source: 'node-board', target: 'node-display', animated: true });

    if (project.touchscreen) {
      nodesList.push({
        id: 'node-touch',
        position: { x: 250, y: 220 },
        data: { label: `Touch (${project.touchscreen.driver})` },
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px' }
      });
      edgesList.push({ id: 'e-board-touch', source: 'node-board', target: 'node-touch', animated: true });
    }

    nodesList.push({
      id: 'node-lvgl-root',
      position: { x: 480, y: 80 },
      data: { label: 'LVGL Screen' },
      style: { background: '#312e81', color: '#e0e7ff', border: '1px solid #6366f1', borderRadius: '8px', padding: '10px' }
    });
    edgesList.push({ id: 'e-display-lvgl', source: 'node-display', target: 'node-lvgl-root' });

    // Recursive helper to traverse widgets & children
    let yCounters: Record<number, number> = {};

    function addWidgetNodes(widget: LvglWidget, parentNodeId: string, level: number) {
      const levelX = 480 + level * 220;
      yCounters[level] = (yCounters[level] || 0) + 1;
      const levelY = yCounters[level] * 70;

      const widgetNodeId = `node-widget-${widget.id}`;
      const isContainer = widget.type === 'tileview' || widget.type === 'container' || widget.type === 'tile' || widget.type === 'obj';

      nodesList.push({
        id: widgetNodeId,
        position: { x: levelX, y: levelY },
        data: { label: `${widget.type.toUpperCase()}: ${widget.id}` },
        style: {
          background: isContainer ? '#1e1b4b' : '#0f172a',
          color: isContainer ? '#818cf8' : '#cbd5e1',
          border: isContainer ? '1px solid #6366f1' : '1px solid #475569',
          borderRadius: '6px',
          padding: '8px',
          fontSize: '12px'
        }
      });

      edgesList.push({
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
      addWidgetNodes(widget, 'node-lvgl-root', 1);
    });

    return { nodes: nodesList, edges: edgesList };
  }, [project]);

  return (
    <div className="w-full h-full bg-slate-950 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={(_, node) => {
          if (node.id.startsWith('node-widget-')) {
            const wId = node.id.replace('node-widget-', '');
            onSelectWidget(wId);
          }
        }}
        fitView
      >
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};
