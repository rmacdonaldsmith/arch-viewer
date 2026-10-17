# No agent coupling in v1: file watching is the integration

The reference implementation couples the viewer to a specific agent: a tmux session, a file-queue mailbox in both directions, and a keystroke "doorbell". In v1 we have no agent-specific integration at all. The viewer watches the Policy and source files and re-scans and redraws when they change, so any agent (or human) that edits those files closes the loop: "tell the agent to change the Policy, watch the diagram update".

## Considered Options

- **Port the tmux + mailbox protocol.** Rejected: it is fragile (keystroke timing, process supervision) and tied to one agent and one terminal setup.
- **MCP server now.** Deferred to v2. It is the right shape for viewer→agent communication (sharing what is selected, requesting a refresh), but it isn't needed to prove the core loop.

## Consequences

- The viewer cannot *tell* the agent anything in v1 (selection context, right-click actions). The user relays that context in chat.
