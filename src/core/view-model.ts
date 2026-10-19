import { compareEnds, compareText } from "./compare.js";
import type { Dependency, IR, Module } from "./ir.js";

export type VisibleNode = { id: string; kind: "component" | "module"; label: string };

/** One drawn arrow: every Dependency between the Modules inside `from` and those inside `to`. */
export type VisibleEdge = { from: string; to: string; dependencies: Dependency[] };

export type ViewModel = { nodes: VisibleNode[]; edges: VisibleEdge[] };

/** Identifies a visible edge by its ends. */
export function edgeKey(edge: { from: string; to: string }): string {
  return `${edge.from} -> ${edge.to}`;
}

/** What to draw at the top level: Components collapse their contents, and Dependencies collapse into one edge per node pair. */
export function viewModel(ir: IR): ViewModel {
  const nodeByModuleId = new Map(ir.modules.map((module) => [module.id, nodeFor(module)]));

  const nodes = uniqueById([...nodeByModuleId.values()]).sort(byId);

  const edgesByPair = new Map<string, VisibleEdge>();
  for (const dependency of ir.dependencies) {
    const from = nodeByModuleId.get(dependency.from);
    const to = nodeByModuleId.get(dependency.to);
    if (!from || !to || from.id === to.id) continue;

    const key = edgeKey({ from: from.id, to: to.id });
    const edge = edgesByPair.get(key) ?? { from: from.id, to: to.id, dependencies: [] };
    edge.dependencies.push(dependency);
    edgesByPair.set(key, edge);
  }
  const edges = [...edgesByPair.values()].sort(compareEnds);

  return { nodes, edges };
}

function nodeFor(module: Module): VisibleNode {
  const [topComponent] = module.componentPath;
  if (topComponent !== undefined) {
    return { id: `component:${topComponent}`, kind: "component", label: topComponent };
  }
  return { id: `module:${module.id}`, kind: "module", label: module.id.split("/").at(-1)! };
}

function uniqueById(nodes: VisibleNode[]): VisibleNode[] {
  return [...new Map(nodes.map((node) => [node.id, node])).values()];
}

const byId = (a: VisibleNode, b: VisibleNode) => compareText(a.id, b.id);
