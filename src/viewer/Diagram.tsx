import { edgeKey } from "../core/view-model.js";
import type { Layout, PlacedEdge, PlacedNode } from "./layout.js";

const MARGIN = 24;

export function Diagram({ layout }: { layout: Layout }) {
  return (
    <svg
      className="diagram"
      width={layout.width + 2 * MARGIN}
      height={layout.height + 2 * MARGIN}
      viewBox={`${-MARGIN} ${-MARGIN} ${layout.width + 2 * MARGIN} ${layout.height + 2 * MARGIN}`}
    >
      <defs>
        <marker id="open-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10" className="arrowhead" />
        </marker>
      </defs>
      {layout.edges.map((edge) => (
        <Edge key={edgeKey(edge)} edge={edge} />
      ))}
      {layout.nodes.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </svg>
  );
}

function Node({ node }: { node: PlacedNode }) {
  return (
    <g className={`node ${node.kind}`} data-node-id={node.id} transform={`translate(${node.x} ${node.y})`}>
      <rect width={node.width} height={node.height} rx={node.kind === "module" ? 6 : 0} />
      <text x={node.width / 2} y={node.height / 2} dominantBaseline="central" textAnchor="middle">
        {node.label}
      </text>
    </g>
  );
}

function Edge({ edge }: { edge: PlacedEdge }) {
  const d = edge.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <path className="edge" data-edge-from={edge.from} data-edge-to={edge.to} d={d} markerEnd="url(#open-arrow)" />
  );
}
