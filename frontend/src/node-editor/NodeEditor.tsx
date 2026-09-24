import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  NodeTypes
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Esp32Project,
  LvglWidget,
  getConnectedComponents,
  calculateGroupContainers
} from '@esp32-designer/shared';
import { CustomNode } from './CustomNode';
import { GroupNode } from './GroupNode';

interface NodeEditorProps {
  project: Esp32Project;
  onSelectWidget: (widgetId: string) => void;
}

const nodeTypes: NodeTypes = {
  customWidgetNode: CustomNode,
  groupContainerNode: GroupNode
};

export const NodeEditor: React.FC<NodeEditorProps> = ({ project, onSelectWidget }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightDependencies, setHighlightDependencies] = useState<boolean>(true);
  const [hideUnconnected, setHideUnconnected] = useState<boolean>(false);

  // Initialize nodes and edges from project structure
  useEffect(() => {
    const initialNodes: Node[] = [];
    const initialEdges: Edge[] = [];

    // Board Node
    initialNodes.push({
      id: 'node-board',
      type: 'customWidgetNode',
      position: { x: 40, y: 40 },
      data: {
        label: project.board.board || 'ESP32 DevKit',
        type: 'ESP32 MCU',
        badge: 'MCU'
      }
    });

    // Display Node
    initialNodes.push({
      id: 'node-display',
      type: 'customWidgetNode',
      position: { x: 300, y: 40 },
      data: {
        label: `${project.display.driver || 'Display'}`,
        subtitle: `${project.display.width}x${project.display.height} px`,
        type: 'Display',
        badge: 'SPI/I2C'
      }
    });
    initialEdges.push({
      id: 'e-board-display',
      source: 'node-board',
      target: 'node-display',
      type: 'smoothstep'
    });

    // Touch Node
    if (project.touchscreen) {
      initialNodes.push({
        id: 'node-touch',
        type: 'customWidgetNode',
        position: { x: 300, y: 140 },
        data: {
          label: `${project.touchscreen.driver || 'Touch'}`,
          type: 'Touchscreen',
          badge: 'I2C'
        }
      });
      initialEdges.push({
        id: 'e-board-touch',
        source: 'node-board',
        target: 'node-touch',
        type: 'smoothstep'
      });
    }

    // LVGL Root Canvas Node
    initialNodes.push({
      id: 'node-lvgl-root',
      type: 'customWidgetNode',
      position: { x: 560, y: 40 },
      data: {
        label: 'LVGL Screen Canvas',
        type: 'LVGL ROOT',
        badge: 'SCREEN',
        isContainer: true
      }
    });
    initialEdges.push({
      id: 'e-display-lvgl',
      source: 'node-display',
      target: 'node-lvgl-root',
      type: 'smoothstep'
    });

    // LVGL Widgets Stacked Hierarchy
    let yCounters: Record<number, number> = {};

    function addWidgetNodes(widget: LvglWidget, parentNodeId: string, level: number) {
      const levelX = 840 + level * 280;
      yCounters[level] = (yCounters[level] || 0) + 1;
      const levelY = yCounters[level] * 90 - 40;

      const widgetNodeId = `node-widget-${widget.id}`;
      const isContainer =
        widget.type === 'tileview' ||
        widget.type === 'container' ||
        widget.type === 'tile' ||
        widget.type === 'tiles' ||
        widget.type === 'obj';

      initialNodes.push({
        id: widgetNodeId,
        type: 'customWidgetNode',
        position: { x: levelX, y: levelY },
        data: {
          label: widget.id,
          type: widget.type.toUpperCase(),
          badge: isContainer ? 'CONTAINER' : 'WIDGET',
          isContainer
        }
      });

      initialEdges.push({
        id: `e-${parentNodeId}-${widget.id}`,
        source: parentNodeId,
        target: widgetNodeId,
        type: 'smoothstep'
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

  // Dynamically compute connected components and group container nodes
  const groupContainerNodes = useMemo<Node[]>(() => {
    // Only pass non-group nodes to component detection
    const nonGroupNodes = nodes.filter((n) => n.type !== 'groupContainerNode');
    const components = getConnectedComponents(nonGroupNodes, edges);
    const containers = calculateGroupContainers(components, nonGroupNodes, {
      padding: 24,
      headerHeight: 32
    });

    return containers.map((c) => ({
      id: c.id,
      type: 'groupContainerNode',
      position: { x: c.bounds.x, y: c.bounds.y },
      data: {
        title: c.title,
        nodeCount: c.nodeIds.length,
        width: c.bounds.width,
        height: c.bounds.height
      },
      selectable: false,
      draggable: false,
      zIndex: -1
    }));
  }, [nodes, edges]);

  // Combine regular nodes and group containers (group containers positioned behind)
  const combinedNodes = useMemo<Node[]>(() => {
    const nonGroupNodes = nodes.filter((n) => n.type !== 'groupContainerNode');
    return [...groupContainerNodes, ...nonGroupNodes];
  }, [nodes, groupContainerNodes]);

  // Dependency graph computation (Upstream / Downstream)
  const dependencyInfo = useMemo(() => {
    if (!selectedNodeId) {
      return { upstreamNodes: new Set<string>(), downstreamNodes: new Set<string>(), connectedEdges: new Set<string>() };
    }

    const upstreamNodes = new Set<string>();
    const downstreamNodes = new Set<string>();
    const connectedEdges = new Set<string>();

    const findUpstream = (nodeId: string) => {
      edges.forEach((e) => {
        if (e.target === nodeId) {
          upstreamNodes.add(e.source);
          connectedEdges.add(e.id);
          findUpstream(e.source);
        }
      });
    };

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

  // Styling and filtering based on dependencies / focus options
  const styledNodes = useMemo<Node[]>(() => {
    return combinedNodes.map((node) => {
      if (node.type === 'groupContainerNode') {
        return node;
      }

      const isSelected = node.id === selectedNodeId;
      const isUpstream = dependencyInfo.upstreamNodes.has(node.id);
      const isDownstream = dependencyInfo.downstreamNodes.has(node.id);
      const isConnected = isSelected || isUpstream || isDownstream;

      let hidden = false;
      if (selectedNodeId && hideUnconnected && !isConnected) {
        hidden = true;
      }

      let customStyle = { ...(node.style || {}) };

      if (selectedNodeId && highlightDependencies) {
        if (isSelected) {
          customStyle = { ...customStyle, opacity: 1 };
        } else if (isUpstream) {
          customStyle = { ...customStyle, opacity: 1, filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' };
        } else if (isDownstream) {
          customStyle = { ...customStyle, opacity: 1, filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' };
        } else {
          customStyle = { ...customStyle, opacity: 0.3, filter: 'grayscale(60%)' };
        }
      }

      return {
        ...node,
        hidden,
        style: customStyle
      };
    });
  }, [combinedNodes, selectedNodeId, dependencyInfo, highlightDependencies, hideUnconnected]);

  const styledEdges = useMemo<Edge[]>(() => {
    return edges.map((edge) => {
      const isConnected = dependencyInfo.connectedEdges.has(edge.id);

      let hidden = false;
      if (selectedNodeId && hideUnconnected && !isConnected) {
        hidden = true;
      }

      let style = { ...(edge.style || {}), stroke: '#475569', strokeWidth: 1.5 };
      let animated = false;

      if (selectedNodeId && highlightDependencies) {
        if (isConnected) {
          style = { stroke: '#38bdf8', strokeWidth: 2.5 };
          animated = true;
        } else {
          style = { stroke: '#1e293b', strokeWidth: 1, opacity: 0.2 };
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
      {/* Dependency Options Panel */}
      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-800 rounded-lg p-3 shadow-xl flex flex-col gap-2 text-xs text-slate-200 backdrop-blur-sm">
        <div className="font-semibold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span>Graph & Group Options</span>
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
          <span>Highlight Up/Down Dependencies</span>
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
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
              Selected Node
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
              Upstream Parent (Sources)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Downstream Child (Targets)
            </div>
          </div>
        )}
      </div>

      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          if (node.type === 'groupContainerNode') return;
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
