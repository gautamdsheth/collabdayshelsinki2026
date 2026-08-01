const assert = require("node:assert/strict");
const test = require("node:test");

const { getAllItemsFromAPI } = require("../dist/src/custom/getAllItemsFromAPI.js");
const {
  getExternalItemFromItem,
} = require("../dist/src/custom/getExternalItemFromItem.js");
const schema = require("../src/references/schema.json");

const tenantDirectory = {
  "Gautam Sheth": "gautam@koskila.onmicrosoft.com",
  "Antti Koskela": "koskila@koskila.onmicrosoft.com",
  "Caitlin Frost": "caitlin@koskila.onmicrosoft.com",
  Katsu: "katsu@koskila.onmicrosoft.com",
  Kris: "kris@koskila.onmicrosoft.com",
};

function createConfig() {
  return {
    context: { log() {} },
    connector: { dataPath: "tickets.json" },
  };
}

async function collectTickets(since) {
  const tickets = [];
  for await (const ticket of getAllItemsFromAPI(createConfig(), since)) {
    tickets.push(ticket);
  }
  return tickets;
}

test("loads all support tickets from the JSON source", async () => {
  const tickets = await collectTickets();

  assert.equal(tickets.length, 20);
  assert.equal(new Set(tickets.map(({ id }) => id)).size, tickets.length);

  for (const ticket of tickets) {
    assert.equal(ticket.assignedEngineerEmail, tenantDirectory[ticket.assignedEngineer]);
    assert.equal(ticket.accountOwnerEmail, tenantDirectory[ticket.accountOwner]);
    assert.match(ticket.link, /^https:\/\/github\.com\/pnp\/powershell\/issues\/\d+$/);
  }

  assert.equal(new Set(tickets.map(({ link }) => link)).size, tickets.length);
});

test("incremental loading returns only tickets updated after the crawl time", async () => {
  const tickets = await collectTickets(new Date("2026-07-26T08:30:00Z"));

  assert.deepEqual(
    tickets.map(({ id }) => id),
    ["TKT-2026-009", "TKT-2026-015", "TKT-2026-019"]
  );
});

test("maps a ticket to a Graph external item", async () => {
  const [ticket] = await collectTickets();
  const externalItem = getExternalItemFromItem(ticket);

  assert.equal(externalItem.id, ticket.id);
  assert.equal(externalItem.properties.title, ticket.title);
  assert.equal(externalItem.properties.link, ticket.link);
  assert.equal(externalItem.properties.assignedEngineerEmail, ticket.assignedEngineerEmail);
  assert.equal(externalItem.properties.accountOwnerEmail, ticket.accountOwnerEmail);
  assert.equal(externalItem.properties.updatedDateTime, ticket.dates.updatedDateTime);
  assert.match(externalItem.content.value, /Customer: Northwind Operations/);
  assert.match(externalItem.content.value, /gautam@koskila\.onmicrosoft\.com/);
  assert.deepEqual(externalItem.acl, [
    { accessType: "grant", type: "everyone", value: "everyone" },
  ]);
});

test("labels the ticket link as the Graph result URL", () => {
  const linkProperty = schema.find(({ name }) => name === "link");

  assert.deepEqual(linkProperty.labels, ["url"]);
  assert.equal(linkProperty.isRetrievable, true);
});