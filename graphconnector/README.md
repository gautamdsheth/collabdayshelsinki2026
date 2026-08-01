# Internal Support Tickets Copilot Connector

A TypeScript Microsoft Graph connector that creates an external connection and schema, then ingests the records in `tickets.json` for Microsoft 365 Copilot and Microsoft Search.

## What it does

- Creates the `InternalSupportTickets` external connection.
- Creates searchable, queryable, retrievable, and refinable ticket properties.
- Indexes tenant email identities for assigned engineers and account owners.
- Uses each ticket's PnP PowerShell issue link as the clickable Graph result URL.
- Flattens the nested source `dates` object into Graph `DateTime` properties.
- Performs a full crawl and timestamp-based incremental crawls.
- Uses each ticket `id` as the Microsoft Graph external item ID.
- Grants every user in the tenant access to every ingested item.
- Publishes an Internal Support declarative agent grounded only on this connector.

The tenant-wide ACL is suitable only when all tickets are visible to all employees. Update `src/custom/getAclFromItem.ts` before using data with restricted visibility.

## Prerequisites

- Node.js 22 for Azure Functions and connector code
- Node.js 24 installed through NVM for the local Azurite process only
- Microsoft 365 Agents Toolkit CLI (`atk`) newer than `1.1.5-beta`
- Azure Functions Core Tools 4 for local execution
- Azurite for local storage
- A Microsoft 365 tenant where you can grant tenant-wide admin consent

The Entra application requests the Microsoft Graph application permissions declared in `aad.manifest.json`, including external connection and external item write access.

## Project layout

- `tickets.json`: source ticket records
- `src/references/schema.json`: Microsoft Graph external connection schema
- `src/custom/getAllItemsFromAPI.ts`: full and incremental ticket reader
- `src/custom/getExternalItemFromItem.ts`: Graph external item mapper
- `src/custom/getAclFromItem.ts`: per-item access control
- `src/functions/connections.ts`: connection deployment and crawl triggers
- `appPackage/declarativeAgent.json`: Copilot agent definition and connector capability
- `appPackage/instruction.txt`: support-ticket behavior and grounding instructions
- `appPackage/manifest.json`: Microsoft 365 app package manifest
- `m365agents.local.yml`: local provisioning
- `m365agents.yml`: Azure provisioning and deployment

## Validate locally

```powershell
npm install
npm test
```

If the `azure-functions-core-tools` package download is unavailable, compile and test the connector with:

```powershell
npm install --ignore-scripts
npm test
```

Azure Functions Core Tools must still be installed before starting the local Functions host.

## Provision and ingest locally

Local mode registers the Entra application and Graph connector in Microsoft 365, but runs Azurite and Azure Functions on this computer. It does not provision or deploy Azure resources.

### Run with F5

1. Open the `graphconnector` folder itself in VS Code so its `.vscode/launch.json` is active.
2. In Microsoft 365 Agents Toolkit, sign in to the intended Microsoft 365 tenant. An Azure subscription login is not required.
3. Select **Run and Debug > Debug Copilot connector**, then press **F5**.
4. When the Functions output prints the Entra admin-consent URL, open it as an administrator of the target tenant and grant consent.
5. Restart the F5 session after consent if the initial connection attempt does not resume automatically.

The F5 compound task installs dependencies, starts Azurite, provisions the local Entra application, starts the TypeScript watcher, and launches the Functions host. The Graph client uses the generated tenant-specific client credentials from `local.settings.json`; it does not use the active Azure CLI account.

Azure Functions and the connector run on Node 22. On this Windows/NVM setup, the Azurite emulator alone runs on Node 24 because Azurite 3.36 hangs during startup under Node 22; the runtimes are isolated processes.

To run the same flow manually, sign in through Microsoft 365 Agents Toolkit and execute:

```powershell
Set-Location C:\collabdayshelsinki2026\graphconnector
$env:ATK_CLI_SKILL = "true"
atk provision --env local -i false
npm run storage
npm start
```

`npm run storage` and `npm start` are long-running processes and should run in separate terminals. Local provisioning creates `local.settings.json`; do not commit that file. Do not run `atk auth login azure`, `atk provision --env dev`, or `atk deploy --env dev` for local mode.

On startup, the `deployConnection` function:

1. Creates the external connection.
2. Creates the schema.
3. Applies the Adaptive Card result layout.
4. Runs the initial ticket crawl.

Use the admin-consent URL printed during provisioning. Then open Microsoft 365 Admin Center, go to **Search & Intelligence > Data sources**, select **Internal Support Tickets**, and include the connector results.

Useful prompts include:

- `Show critical open support tickets.`
- `Which tickets are assigned to Gautam Sheth?`
- `Summarize support issues for Northwind Operations.`

## Use the declarative agent

Local provisioning also validates, uploads, and publishes the **Internal Support** declarative agent for the signed-in Microsoft 365 user. The agent's `GraphConnectors` capability is restricted to the `InternalSupportTickets` connection and is read-only.

After provisioning, open Microsoft 365 Copilot and select **Agents > Internal Support**. Newly published agents can take a few minutes to appear. The current local deployment uses:

- Teams app ID: `ad41be47-fd94-489a-ae1e-976ca113a150`
- Microsoft 365 title ID: `T_49512a2f-632f-f65f-e04a-59e23973c123`
- Microsoft 365 app ID: `1f234daa-2f49-4029-8eb6-10965a3e3783`

Re-run `atk provision --env local -i false` after changing the app manifest, agent manifest, or instructions. Increment the version in `appPackage/manifest.json` before distributing a changed package beyond the current user.

## Updating tickets

Edit `tickets.json` and set `dates.updatedDateTime` to a newer ISO 8601 UTC timestamp. The incremental crawl compares that value with the last successful crawl time.

Graph connector schemas cannot be changed after registration. During development, call the local `POST /api/retract` endpoint to delete the connection, then restart the Functions host to recreate it with a changed schema.

## Deploy to Azure

The Microsoft 365 login determines the tenant where the connector is registered. The Azure login determines the subscription where the Function App runs; confirm both contexts before provisioning.

1. Sign in and verify both accounts:

```powershell
$env:ATK_CLI_SKILL = "true"
atk auth login m365
atk auth login azure
atk auth list
az account show
```

2. Set these values in `env/.env.dev`:

- `AZURE_SUBSCRIPTION_ID`: the intended hosting subscription
- `AZURE_RESOURCE_GROUP_NAME`: an existing resource group
- `RESOURCE_SUFFIX`: 1-6 lowercase letters or digits, unique enough for the storage account and Function App names

Create the resource group first if necessary. The Bicep template currently provisions an `S1` App Service Plan, storage, Key Vault, Application Insights, Log Analytics, and a Function App.

3. Provision resources and deploy the code:

```powershell
$env:ATK_CLI_SKILL = "true"
atk provision --env dev -i false
atk deploy --env dev -i false
```

4. In Entra ID, grant tenant-wide admin consent to the generated application for `ExternalConnection.ReadWrite.OwnedBy` and `ExternalItem.ReadWrite.OwnedBy`.

5. Run the deployed `deployConnection` Azure Function manually after consent. It creates the connection and schema, applies the result layout, and ingests `tickets.json`.

6. In Microsoft 365 Admin Center, open **Search & Intelligence > Data sources**, select **Internal Support Tickets**, and choose **Include Connector Results**.

Allow time for indexing, then test the connector from Microsoft 365 Copilot or Microsoft Search. Graph connector schemas are immutable; delete and recreate the connection before deploying schema changes.

The deployed Functions app schedules full and incremental crawls. Replace the JSON reader with the production ticketing API in `src/custom/getAllItemsFromAPI.ts` when the real data source is available.
