# Internal Support Closure

Declarative agent that verifies internal support tickets are genuinely resolved and closes the GitHub issues backing them, using the GitHub REST API directly as an API plugin. No backend, no Azure Functions — Microsoft 365 Copilot calls `api.github.com` on the signed-in user's behalf.

This is the third stage of the session demo. The `graphconnector` demo indexes the tickets, the `escalation-management` agent assesses and escalates them, and this agent retires them.

## Prerequisites

- Microsoft 365 Agents Toolkit 6.12 or later
- Microsoft 365 Copilot license
- The `InternalSupportTickets` Graph connector already deployed, with ticket `link` values pointing at GitHub issues
- A GitHub App (see below) with **Issues: Read and write** on the target repository

## Configure the GitHub App

This agent uses the App's **user-to-server OAuth** flow. Copilot redirects the user to GitHub, the user consents, and Copilot calls the API as that user. The App ID, installation ID, and private key are *not* used — that is the server-to-server path and it requires a backend to sign a JWT, which this demo deliberately avoids.

In the GitHub App's settings:

1. **Permissions → Repository → Issues: Read and write.** Read-only is not enough to close an issue. After changing this, the organization owner must approve the new permission request before it takes effect on the existing installation.
2. **Callback URL:** `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`
3. **Generate a client secret** (App settings → Client secrets → Generate).
4. Put the **Client ID** (`Iv23...`) and the client secret in `env/.env.dev.user` as `GITHUB_CLIENT_ID` and `SECRET_GITHUB_CLIENT_SECRET`. Do not commit that file.

GitHub ignores the OAuth `scope` parameter for GitHub Apps — effective access comes from the App's configured permissions and which repositories the installation covers. By default GitHub Apps expire user tokens after 8 hours, so `m365agents.yml` registers a `refreshUrl`; disabling "Expire user authorization tokens" in the App settings also works and makes the demo less fragile.

## Provision

1. Sign in to Microsoft 365 through Agents Toolkit.
2. Run Provision against the `dev` environment.
3. Open the agent in Microsoft 365 Copilot and complete the GitHub sign-in prompt.

`oauth/register` stores the OAuth app in the Teams OAuth vault and writes its configuration id to `GITHUB_AUTH_ID`, which `ai-plugin-github.json` references. GitHub OAuth app tokens do not expire, so no refresh URL is registered.

## What the agent can do

| Function | Call | Purpose |
| --- | --- | --- |
| `getIssue` | `GET /repos/gautamdsheth/collabdayshelsinki2026/issues/{issue_number}` | Read current issue state |
| `addIssueComment` | `POST …/issues/{issue_number}/comments` | Record the resolution note |
| `updateIssue` | `PATCH …/issues/{issue_number}` | Close or reopen the issue |

The repository is **fixed in the spec path**, not passed as a parameter. The agent's only derived argument is `issue_number`, which removes any chance of it inventing an owner or repo. To point the demo at a different repository, edit the two `paths` keys in `github-issues.yaml` and the repository name in `instruction.txt`.

The OpenAPI spec in `appPackage/apiSpecificationFile/github-issues.yaml` is a deliberately small subset of the GitHub REST API — three operations. GitHub's full spec is far too large for an API plugin.

## Safety behavior

Reads are unrestricted. Before any write the agent shows a complete preview and then invokes the write function so Microsoft 365 presents its native confirmation card; it adds no second conversational prompt. Closing an issue whose ticket is not `Resolved` or `Closed` requires the user to explicitly acknowledge the mismatch. Bulk closes are confirmed one issue at a time.

The agent derives only `issue_number`, from the trailing segment of each ticket's indexed `link`, never from the ticket ID. In the current data the two coincide (`TKT-2026-005` → issue 5) because the issues were created in ticket order, but the instructions treat that as coincidence rather than a rule.

## Project layout

- `appPackage/declarativeAgent.json`: agent definition, connector grounding, action wiring
- `appPackage/instruction.txt`: closure rules and confirmation behavior
- `appPackage/ai-plugin-github.json`: API plugin manifest and OAuth vault reference
- `appPackage/apiSpecificationFile/github-issues.yaml`: GitHub REST subset
- `appPackage/manifest.json`: Microsoft 365 app package manifest
- `m365agents.yml`: provisioning, including the GitHub OAuth registration

## Troubleshooting

**Sign-in fails at the token exchange.** GitHub's `/login/oauth/access_token` returns form-encoded data unless the caller sends `Accept: application/json`. This is the most common failure for GitHub-backed API plugins. If provisioning succeeds but sign-in does not complete, this is the first thing to check.

**403 on close.** The signed-in GitHub account lacks write access to the repository. The OAuth app grants the user's own permissions — it does not elevate them.

**404 on a private repo.** Expected when the signed-in account is not a member. The connector indexes tickets tenant-wide, but GitHub visibility is per-account.
