# Agents edit the Policy, never the IR

The IR is generated output: a scanner reads source, applies the Policy, and writes the IR that the viewer draws. Humans and agents change what the diagram shows only by editing the Policy (or the code itself) and regenerating. We chose this, following the reference implementation (unclebob/uml-viewer), so that the diagram can never drift from the code. A hand-edited IR would silently diverge on the next scan. It also gives a clean, testable seam: scanner tests assert on IR, and viewer tests use IR fixtures.

## Consequences

- Anything a user wants to express about the architecture (Levels, exclusions, later Proposals) must have a home in the Policy schema. "Just tweak the IR" is never the answer.
- The IR format can change freely between versions, because nobody hand-maintains it.
