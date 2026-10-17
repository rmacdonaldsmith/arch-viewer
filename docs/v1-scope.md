# v1 scope

## Goal

A tool for understanding and steering real codebases, first a Java + React/TS(+JS) project at work. v1 proves the base loop: **scan → draw the real tree → mark Violations → an agent edits the Policy or code → the diagram updates.**

## Decisions

| Area | Decision |
|---|---|
| Implementation | TypeScript end to end. Node 22 LTS, pnpm, Vitest, ESLint |
| Surface | Local web app: the CLI serves a React + SVG viewer (Vite) |
| Layout | elkjs (layered, compound nodes, orthogonal edges). Custom routing only where ELK visibly fails |
| Agent coupling | None. File watching is the integration ([ADR-0002](adr/0002-no-agent-coupling-in-v1.md)). MCP in v2 |
| Inputs | Policy (YAML, edited by humans and agents) → `scan` → IR (JSON, generated) ([ADR-0001](adr/0001-agents-edit-policy-not-ir.md)) |
| TS/JS scanner | ts-morph (`allowJs`). Module = file, Component = directory, a barrel `index.ts` is its Component's own Module. Skips `*.test.*`, `*.spec.*`, `*.d.ts`, `node_modules`, `dist` |
| Java scanner | tree-sitter-java: imports, plus type-identifier matching for same-package and wildcard references. `jdeps` is the fallback if this is inaccurate. Module = top-level type, Component = package segment below `prefix`. Build modules are ignored (package trees are merged) |
| Levels | Can be assigned to any Component path. A Module takes the Level of its nearest ranked ancestor. Unranked Modules are never evaluated. No wildcards |
| Exceptions | An explicit `allow: [[from, to]]`, where `*` and Component names are allowed. No edge kinds in v1: only Dependency |
| Layout of Levels | ELK partitioning puts Levels in horizontal bands, innermost at the bottom, so Violations point up |
| Rescan | Full rescan on Policy or source change (debounced ~300ms), pushed to the browser over SSE. Time it on the work repo and add incremental scanning only if a rescan takes over ~2s |
| Metrics overlay | Out. The IR stays pure topology. Metrics come later as a separate join keyed by Module id |

## CLI

- `arch-viewer init`: writes a starter Policy with `levels: []`.
- `arch-viewer scan`: Policy → IR, then exits. For agents and CI.
- `arch-viewer`: scan, serve, watch, rescan, push.

## Policy

```yaml
# arch-viewer.policy.yaml
title: arch-viewer
sources:
  - lang: typescript        # .ts/.tsx/.js/.jsx
    root: src
  # - lang: java
  #   root: backend/src/main/java
  #   prefix: com.acme.app
levels:                     # index 0 = innermost
  - [core]
  - [scanner, server]
  - [viewer]
  - [cli]
allow:
  - [cli, "*"]              # composition root wires everything
omit: [viewer/dev-fixtures]
out: arch-viewer.ir.json
```

## IR

```ts
type IR = {
  irVersion: 1
  title: string
  modules: Module[]
  dependencies: Dependency[]
}

type Module = {
  id: string                // "scanner/ts/resolve"
  componentPath: string[]   // ["scanner", "ts"]
  lang: "typescript" | "java"
  file: string
  level?: number
  members: { name: string; kind: string; line: number }[]
}

type Dependency = {
  from: string
  to: string
  violation: boolean
  allowed: boolean
}
```

Components are derived from `componentPath` and not stored, so the tree can't drift from the Modules. Violation is computed when the IR is generated, so agents and CI can read it straight from the JSON.

## Viewer features

| In v1 | Out (later) |
|---|---|
| Top-level Component view, with Dependencies collapsed into one arrow per pair | Declutter modes |
| Double-click to drill in. Esc or the breadcrumb goes up | Right-click actions |
| Violations in red, bold when selected. Allowed dependencies grey with a marker | Level badges |
| Hover an arrow to list its bundled `from → to` pairs | Custom source window |
| Module card: members (kind, line) plus incoming and outgoing Dependencies | Stereotypes |
| Click a member to open it in the editor (`vscode://file/…:line`) | External libraries |
| Zoom and pan. Live reload | Session restore |

Module card members: for TS/JS, exported declarations (functions, classes, consts, types, interfaces). For Java, public and protected methods and fields of the top-level type.

## Testing

- **Scanner:** fixture projects in `test/fixtures/`, each asserted against its expected IR.
- **Core:** pure functions (visible graph for a drill path, Violation evaluation, Allowed matching) tested directly.
- **Viewer:** one Playwright smoke test (load a fixture IR, drill in, assert a red edge). No pixel snapshots.
- **Dogfood:** CI scans arch-viewer with its own Policy and fails if there are Violations.

CI (GitHub Actions) runs typecheck, lint, unit tests, Playwright and the dogfood scan on every push.

## Build order

| # | Slice | Done when |
|---|---|---|
| M0 | Walking skeleton: scaffold and CI. `scan` on a TS fixture gives Modules and Dependencies. The viewer draws top-level Components with ELK | The CI dogfood scan succeeds on arch-viewer itself |
| M1 | Drill-down, collapsed edges, hover popup, breadcrumb and Esc | The Playwright smoke test drills one level |
| M2 | Levels, Violations, Allowed dependencies, Level bands | The CI gate fails on any arch-viewer Violation |
| M3 | Module card, open in editor | Clicking a member opens VS Code at the right line |
| M4 | `init`, file watching, rescan, SSE live reload | An agent edits the Policy and the diagram updates with no restart |
| M5 | Java scanner | A Java fixture with an implicit same-package Dependency passes |

## Later

- **v1.1:** Proposals. Cycle detection (needs its own visual treatment, distinct from Violations).
- **v2:** MCP server (viewer ↔ agent), metrics overlay (coverage, CRAP, mutation), cross-language links (React `fetch` → Spring `@GetMapping`), external libraries.
