import { Item } from "../models/Item";
import { ExternalConnectors } from "@microsoft/microsoft-graph-types";
import { getAclFromITem } from "./getAclFromItem";

// [Customization point]
// If there is additional logic to transform the item, you can add it here
// This function is used to transform the item into a format that can be ingested by the Graph API.
// The item is transformed into an ExternalItem object that can be ingested by the Graph API.
// The ExternalItem object is used to represent the item in the Graph API.
// See the Graph API documentation to understand the structure of the ExternalItem object and how to convert the item into it.
// https://learn.microsoft.com/en-us/graph/api/resources/connectors-api-overview?view=graph-rest-1.0
// https://learn.microsoft.com/en-us/graph/api/externalconnectors-externalconnection-put-items?view=graph-rest-1.0

/**
 * @param item - The item to transform.
 * @returns
 */
export function getExternalItemFromItem(item: Item): ExternalConnectors.ExternalItem {
  const properties = {
    title: item.title,
    link: item.link,
    description: item.description,
    customer: item.customer,
    status: item.status,
    priority: item.priority,
    assignedEngineer: item.assignedEngineer,
    assignedEngineerEmail: item.assignedEngineerEmail,
    accountOwner: item.accountOwner,
    accountOwnerEmail: item.accountOwnerEmail,
    createdDateTime: item.dates.createdDateTime,
    updatedDateTime: item.dates.updatedDateTime,
    dueDateTime: item.dates.dueDateTime,
    ...(item.dates.resolvedDateTime
      ? { resolvedDateTime: item.dates.resolvedDateTime }
      : {}),
  };

  return {
    id: item.id,
    properties,
    content: {
      value: [
        item.title,
        item.description,
        `Customer: ${item.customer}`,
        `Status: ${item.status}`,
        `Priority: ${item.priority}`,
        `Assigned engineer: ${item.assignedEngineer} (${item.assignedEngineerEmail})`,
        `Account owner: ${item.accountOwner} (${item.accountOwnerEmail})`,
        `Link: ${item.link}`,
      ].join("\n"),
      type: "text",
    },
    acl: getAclFromITem(item),
  } as ExternalConnectors.ExternalItem;
}
