# Arch Viewer

An interactive diagram of a codebase's structure that lets you drill from components down to source, see where dependencies break the declared architecture, and explore what-if regroupings.

## Language

### Structure

**Module**:
One source unit (a TS/JS file, or a Java top-level type with its nested types), and the smallest thing drawn on the diagram.
_Avoid_: Class (unless the scanner emits a real class), file, unit

**Build module**:
A Maven/Gradle (or JPMS) module. Not a Module, and not drawn in v1.
_Avoid_: Module, project, subproject

**Component**:
A node in the package/directory tree (below the Policy prefix) that contains Modules and/or other Components. A barrel file (`index.ts`) is its Component's own Module.
_Avoid_: Layer, package, group

**Dependency**:
A directed source-code reference from one Module to another (import, require, use).
_Avoid_: Link, edge (when talking about the domain rather than the drawing)

### Architecture rules

**Level**:
A declared architectural rank for a top-level Component; a lower Level is more inner (higher-level policy). Independent of nesting depth.
_Avoid_: Layer, tier, depth

**Violation**:
A Dependency that points from an inner Level to an outer Level.
_Avoid_: Bad arrow, red edge

**Allowed dependency**:
A Dependency that would be a Violation but that the Policy explicitly permits, such as composition-root wiring.
_Avoid_: Exemption, association, whitelist

**Proposal**:
A named what-if regrouping of existing Components that does not exist in the code.
_Avoid_: Scenario, draft, design

### Inputs

**Policy**:
The human- and agent-edited description of how to view a codebase: its root, prefix, Levels, and exclusions.
_Avoid_: Config, settings

**IR**:
The generated snapshot of Modules, Components, and Dependencies that the viewer draws. Never edited by hand.
_Avoid_: Model, graph, diagram file
