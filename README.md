# Collab Days Helsinki 2026

Demo code for my Collab Days Helsinki 2026 session on extending Microsoft 365 Copilot.

## Demos

| Folder | Demo |
| --- | --- |
| [`graphconnector/`](graphconnector/) | **Internal Support Tickets Copilot Connector** — a TypeScript Microsoft Graph connector that creates an external connection and schema, then ingests support tickets for Microsoft 365 Copilot and Microsoft Search. |
| [`escalation-management/`](escalation-management/) | **Internal Support Escalation** — a declarative agent that assesses tickets from the connector above and uses the Work IQ User, Mail, Calendar, and Teams MCP servers to prepare confirmed escalations. |

Each folder has its own README with prerequisites and setup steps. Run the connector demo first — the agent demo is grounded on the `InternalSupportTickets` connection it creates.

## Configuration

No credentials are committed. Every environment file that holds a secret or tenant-specific ID is git-ignored and shipped as a `.sample` template instead:

- `escalation-management/env/.env.dev.sample`
- `escalation-management/env/.env.dev.user.sample`
- `graphconnector/env/.env.dev.sample`
- `graphconnector/local.settings.json.sample`

Copy each one to its real filename (drop `.sample`) and fill in your own values. Bring your own Entra app registration and tenant.
