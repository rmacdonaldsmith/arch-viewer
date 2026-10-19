import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { ViewModel, VisibleNode } from "../core/view-model.js";

export type Point = { x: number; y: number };
export type PlacedNode = VisibleNode & { x: number; y: number; width: number; height: number };
export type PlacedEdge = { from: string; to: string; points: Point[]; count: number };
export type Layout = { width: number; height: number; nodes: PlacedNode[]; edges: PlacedEdge[] };

const PADDING_X = 16;
const NODE_HEIGHT = 40;

const elk = new ELK();

/** Positions the visible graph with ELK's layered algorithm and orthogonal edge routing. */
export async function layout(graph: ViewModel, measureText: (text: string) => number): Promise<Layout> {
  const result: ElkNode = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
    },
    children: graph.nodes.map((node) => ({
      id: node.id,
      width: measureText(node.label) + 2 * PADDING_X,
      height: NODE_HEIGHT,
    })),
    edges: graph.edges.map((edge) => ({
      id: `${edge.from} -> ${edge.to}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  });

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const edgeById = new Map(graph.edges.map((edge) => [`${edge.from} -> ${edge.to}`, edge]));

  return {
    width: result.width ?? 0,
    height: result.height ?? 0,
    nodes: (result.children ?? []).map((child) => ({
      ...nodeById.get(child.id)!,
      x: child.x ?? 0,
      y: child.y ?? 0,
      width: child.width ?? 0,
      height: child.height ?? 0,
    })),
    edges: (result.edges ?? []).map((elkEdge) => {
      const edge = edgeById.get(elkEdge.id)!;
      const section = elkEdge.sections?.[0];
      const points = section ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint] : [];
      return { from: edge.from, to: edge.to, points, count: edge.dependencies.length };
    }),
  };
}
