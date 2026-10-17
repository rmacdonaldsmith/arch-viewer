# arch-viewer

Interactive architecture diagrams of a codebase. Drill from Components down to Modules and on to source, and see where Dependencies break your declared architecture (Violations of the dependency rule).

Status: design phase, building v1. See [v1 scope](docs/v1-scope.md), the [glossary](CONTEXT.md), and the [ADRs](docs/adr/).

## Credits

The reference implementation is [unclebob/uml-viewer](https://github.com/unclebob/uml-viewer) (Clojure/Quil). arch-viewer is a TypeScript reimplementation of its core ideas: the Policy → IR split, namespace-tree drill-down, and dependency-rule Violations drawn in red.
