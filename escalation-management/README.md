# Internal Support Escalation

Declarative agent that assesses tickets from the `InternalSupportTickets` Graph connector and uses Work IQ User, Mail, Calendar, and Teams MCP servers to prepare confirmed escalations.

## Prerequisites

- Microsoft 365 Agents Toolkit 6.12 or later
- Microsoft 365 Copilot license and Work IQ MCP preview access
- An Entra app registration in your Microsoft 365 tenant
- Web redirect URI `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`
- A client secret for the app registration
- Delegated Work IQ permissions for User, Mail, Calendar, and Teams with admin consent
- The Work IQ MCP servers allowed in Microsoft 365 admin center under Agents and Tools

## Configure and provision

1. Put the Entra application ID and secret in `env/.env.dev.user` as `WORKIQ_CLIENT_ID` and `SECRET_WORKIQ_CLIENT_SECRET`. Do not commit that file.
2. Sign in to Microsoft 365 through Agents Toolkit.
3. Run Provision against the `dev` environment.
4. Open the installed agent in Microsoft 365 Copilot and complete the per-server sign-in prompts.

Provision registers one OAuth configuration shared by the Work IQ User, Mail, Calendar, and Teams servers. The Entra app requests all four delegated permissions from the Agent Tools resource.

## Safety behavior

The agent may assess tickets, resolve users, check for duplicate escalations, and find availability without confirmation. Teams escalation messages use structured plain text and are restricted to the `Customer Escalation` team's `General` channel. Before sending mail, creating a meeting, or posting to that channel, the agent shows a complete preview and invokes the write tool so Microsoft 365 can present its native confirmation card. The agent does not add a second conversational confirmation prompt.