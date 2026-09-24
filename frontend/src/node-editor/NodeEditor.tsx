import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Esp32Project } from '@esp32-designer/shared';

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
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #3b82f6', borderRadius: '8px' }
    });

    nodesList.push({
      id: 'node-display',
      position: { x: 250, y: 80 },
      data: { label: `Display (${project.display.width}x${project.display.height})` },
      style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #10b981', borderRadius: '8px' }
    });
    edgesList.push({ id: 'e-board-display', source: 'node-board', target: 'node-display', animated: true });

    if (project.touchscreen) {
      nodesList.push({
        id: 'node-touch',
        position: { x: 250, y: 220 },
        data: { label: `Touch (${project.touchscreen.driver})` },
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #f59e0b', borderRadius: '8px' }
      });
      edgesList.push({ id: 'e-board-touch', source: 'node-board', target: 'node-touch', animated: true });
    }

    nodesList.push({
      id: 'node-lvgl-root',
      position: { x: 480, y: 80 },
      data: { label: 'LVGL Screen' },
      style: { background: '#312e81', color: '#e0e7ff', border: '1px solid #6366f1', borderRadius: '8px' }
    });
    edgesList.push({ id: 'e-display-lvgl', source: 'node-display', target: 'node-lvgl-root' });

    let yOffset = 20;
    project.lvgl.widgets.forEach((widget) => {
      const widgetNodeId = `node-widget-${widget.id}`;
      nodesList.push({
        id: widgetNodeId,
        position: { x: 700, y: yOffset },
        data: { label: `${widget.type.toUpperCase()}: ${widget.id}` },
        style: { background: '#0f172a', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px' }
      });
      edgesList.push({ id: `e-lvgl-${widget.id}`, source: 'node-lvgl-root', target: widgetNodeId });
      yOffset += 70;
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
