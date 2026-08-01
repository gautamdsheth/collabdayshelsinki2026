// [Customization point]
// If you need additional properties in the item object, you can add them here
export interface TicketDates {
  createdDateTime: string;
  updatedDateTime: string;
  dueDateTime: string;
  resolvedDateTime: string | null;
}

/** Represents an internal support ticket before it is mapped to Microsoft Graph. */
export interface Item {
  id: string;
  title: string;
  link: string;
  description: string;
  customer: string;
  status: string;
  priority: string;
  assignedEngineer: string;
  assignedEngineerEmail: string;
  accountOwner: string;
  accountOwnerEmail: string;
  dates: TicketDates;
}
