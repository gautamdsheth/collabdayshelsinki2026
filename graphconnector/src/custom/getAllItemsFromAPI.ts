import { readFile } from "node:fs/promises";
import path from "node:path";
import { Config } from "../models/Config";
import { Item } from "../models/Item";

/** Loads support tickets from the JSON data source and yields tickets changed since the last crawl. */
export async function* getAllItemsFromAPI(
  config: Config,
  since?: Date
): AsyncGenerator<Item> {
  const ticketsPath = path.resolve(process.cwd(), config.connector.dataPath);
  config.context.log(`Loading support tickets from ${ticketsPath}`);

  const tickets = JSON.parse(await readFile(ticketsPath, "utf8")) as Item[];
  for (const ticket of tickets) {
    if (!since || new Date(ticket.dates.updatedDateTime) > since) {
      yield ticket;
    }
  }
}
