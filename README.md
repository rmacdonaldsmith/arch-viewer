# arch-viewer

Interactive architecture diagrams of a codebase. Drill from Components down to Modules and on to source, and see where Dependencies break your declared architecture (Violations of the dependency rule).

Status: design phase. See the [glossary](CONTEXT.md) and the [ADRs](docs/adr/).

## Run

Needs Node 22+ and pnpm.

```bash
pnpm install
pnpm exec vite build                 # build the viewer (once, and after viewer changes)
pnpm start [policy-file] [--port n]  # scan, then serve the diagram (prints the URL)
pnpm scan [policy-file]              # scan only: write the IR to the Policy's `out`
```

`policy-file` defaults to `arch-viewer.policy.yaml`, and the project root is the Policy file's directory. A minimal Policy:

```yaml
title: my-app
sources:
  - lang: typescript   # covers .ts/.tsx/.js/.jsx
    root: src
out: my-app.ir.json
```

## Develop

```bash
pnpm test       # unit tests (Vitest)
pnpm test:e2e   # builds the viewer, then runs the end-to-end tests (Playwright)
pnpm typecheck
pnpm lint
```

## Credits

The reference implementation is [unclebob/uml-viewer](https://github.com/unclebob/uml-viewer) (Clojure/Quil). arch-viewer is a TypeScript reimplementation of its core ideas: the Policy → IR split, namespace-tree drill-down, and dependency-rule Violations drawn in red.
