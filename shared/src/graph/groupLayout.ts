import { ComponentGroup, MinimalNode } from './connectedComponents.js';

export interface GroupLayoutConfig {
  padding?: number;
  headerHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface CalculatedGroupContainer {
  id: string;
  title: string;
  nodeIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const DEFAULT_GROUP_PADDING = 30;
export const DEFAULT_GROUP_HEADER_HEIGHT = 36;
export const DEFAULT_NODE_WIDTH = 220;
export const DEFAULT_NODE_HEIGHT = 60;

/**
 * Calculates bounding box and position for visual group containers.
 */
export function calculateGroupContainers(
  groups: ComponentGroup[],
  nodes: MinimalNode[],
  config: GroupLayoutConfig = {}
): CalculatedGroupContainer[] {
  const padding = config.padding ?? DEFAULT_GROUP_PADDING;
  const headerHeight = config.headerHeight ?? DEFAULT_GROUP_HEADER_HEIGHT;
  const minWidth = config.minWidth ?? 180;
  const minHeight = config.minHeight ?? 100;

  const nodeMap = new Map<string, MinimalNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const containers: CalculatedGroupContainer[] = [];

  groups.forEach((group, index) => {
    // Exclude group container nodes
    const memberNodes = group.nodeIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is MinimalNode => n !== undefined);

    if (memberNodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    memberNodes.forEach((node) => {
      const posX = node.position?.x ?? 0;
      const posY = node.position?.y ?? 0;
      const w = node.width ?? DEFAULT_NODE_WIDTH;
      const h = node.height ?? DEFAULT_NODE_HEIGHT;

      minX = Math.min(minX, posX);
      minY = Math.min(minY, posY);
      maxX = Math.max(maxX, posX + w);
      maxY = Math.max(maxY, posY + h);
    });

    const boxX = minX - padding;
    const boxY = minY - padding - headerHeight;
    const boxWidth = Math.max(minWidth, maxX - minX + padding * 2);
    const boxHeight = Math.max(minHeight, maxY - minY + padding * 2 + headerHeight);

    // Derive header title from member nodes if available
    let title = `GROUP ${index + 1}`;
    if (memberNodes.some((n) => n.id === 'node-board' || n.id === 'node-display')) {
      title = 'HARDWARE LAYER';
    } else if (memberNodes.some((n) => n.id === 'node-lvgl-root')) {
      title = 'LVGL PIPELINE';
    }

    containers.push({
      id: `group-container-${group.id}`,
      title,
      nodeIds: group.nodeIds,
      bounds: {
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight
      }
    });
  });

  return containers;
}
