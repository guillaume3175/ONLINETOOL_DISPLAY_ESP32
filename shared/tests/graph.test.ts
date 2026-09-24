import { describe, it, expect } from 'vitest';
import {
  getConnectedComponents,
  calculateGroupContainers,
  MinimalNode,
  MinimalEdge
} from '../src/index.js';

describe('Connected Components & Group Layout Graph Algorithms', () => {
  it('1. Single connected component', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }];
    const edges: MinimalEdge[] = [{ id: 'e1', source: 'A', target: 'B' }];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(1);
    expect(components[0].nodeIds).toEqual(expect.arrayContaining(['A', 'B']));
  });

  it('2. Multiple connected components', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
    const edges: MinimalEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'C', target: 'D' }
    ];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(2);
  });

  it('3. Completely disconnected nodes', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges: MinimalEdge[] = [];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(3);
  });

  it('4. Chain: A -> B -> C -> D', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }];
    const edges: MinimalEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
      { id: 'e3', source: 'C', target: 'D' }
    ];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(1);
    expect(components[0].nodeIds).toHaveLength(4);
  });

  it('5. Branching graph (A -> B, A -> C)', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges: MinimalEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'A', target: 'C' }
    ];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(1);
    expect(components[0].nodeIds).toHaveLength(3);
  });

  it('6. Graph containing cycles (A -> B -> C -> A)', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges: MinimalEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
      { id: 'e3', source: 'C', target: 'A' }
    ];

    const components = getConnectedComponents(nodes, edges);
    expect(components).toHaveLength(1);
    expect(components[0].nodeIds).toHaveLength(3);
  });

  it('7. Removing an edge splits a group', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }];
    let edges: MinimalEdge[] = [{ id: 'e1', source: 'A', target: 'B' }];

    expect(getConnectedComponents(nodes, edges)).toHaveLength(1);

    // Remove edge
    edges = [];
    expect(getConnectedComponents(nodes, edges)).toHaveLength(2);
  });

  it('8. Removing a node splits a group', () => {
    let nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
    const edges: MinimalEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' }
    ];

    expect(getConnectedComponents(nodes, edges)).toHaveLength(1);

    // Remove middle node B
    nodes = [{ id: 'A' }, { id: 'C' }];
    expect(getConnectedComponents(nodes, edges)).toHaveLength(2);
  });

  it('9. Adding an edge merges groups', () => {
    const nodes: MinimalNode[] = [{ id: 'A' }, { id: 'B' }];
    let edges: MinimalEdge[] = [];

    expect(getConnectedComponents(nodes, edges)).toHaveLength(2);

    // Add edge
    edges = [{ id: 'e1', source: 'A', target: 'B' }];
    expect(getConnectedComponents(nodes, edges)).toHaveLength(1);
  });

  it('10. Calculate group containers bounding box', () => {
    const nodes: MinimalNode[] = [
      { id: 'A', position: { x: 100, y: 100 }, width: 100, height: 50 },
      { id: 'B', position: { x: 300, y: 200 }, width: 100, height: 50 }
    ];
    const edges: MinimalEdge[] = [{ id: 'e1', source: 'A', target: 'B' }];

    const components = getConnectedComponents(nodes, edges);
    const containers = calculateGroupContainers(components, nodes, { padding: 20, headerHeight: 30 });

    expect(containers).toHaveLength(1);
    const box = containers[0].bounds;
    expect(box.x).toBe(100 - 20); // 80
    expect(box.y).toBe(100 - 20 - 30); // 50
    expect(box.width).toBe(400 - 100 + 40); // 340
  });
});
