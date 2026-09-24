export interface MinimalNode {
  id: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface MinimalEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
}

export interface ComponentGroup {
  id: string;
  nodeIds: string[];
}

/**
 * Finds connected components in a graph regardless of edge direction (undirected graph traversal).
 *
 * @param nodes List of nodes
 * @param edges List of edges
 * @returns Array of ComponentGroup containing grouped node IDs
 */
export function getConnectedComponents(
  nodes: MinimalNode[],
  edges: MinimalEdge[]
): ComponentGroup[] {
  // Exclude group container nodes themselves from component calculations
  const nonGroupNodes = nodes.filter((n) => !n.id.startsWith('group-'));
  const nodeMap = new Map<string, MinimalNode>();
  nonGroupNodes.forEach((n) => nodeMap.set(n.id, n));

  // Build adjacency list (undirected)
  const adjacency = new Map<string, Set<string>>();
  nonGroupNodes.forEach((n) => adjacency.set(n.id, new Set<string>()));

  edges.forEach((edge) => {
    // Only link if both source and target exist in nonGroupNodes
    if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    }
  });

  const visited = new Set<string>();
  const groups: ComponentGroup[] = [];

  nonGroupNodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const groupNodeIds: string[] = [];
      const queue: string[] = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        groupNodeIds.push(curr);

        const neighbors = adjacency.get(curr);
        if (neighbors) {
          neighbors.forEach((neighbor) => {
            if (!visited.has(neighbor)) {
              visited.add(neighbor);
              queue.push(neighbor);
            }
          });
        }
      }

      groups.push({
        id: `component-group-${groups.length + 1}`,
        nodeIds: groupNodeIds
      });
    }
  });

  return groups;
}
