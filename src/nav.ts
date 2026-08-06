import { Icons } from "@/components";

export type PageId =
  | "dashboard"
  | "transaction"
  | "history"
  | "cardrequests"
  | "clients"
  | "branches"
  | "accounts"
  | "promotions";

export interface NavItem {
  id: PageId;
  label: string;
  iconD: string;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    iconD: Icons.dashboard,
    group: "Overview",
  },
  {
    id: "transaction",
    label: "Loyalty Scanner",
    iconD: Icons.transaction,
    group: "Operations",
  },
  {
    id: "history",
    label: "Transaction History",
    iconD: Icons.clock,
    group: "Operations",
  },
  {
    id: "cardrequests",
    label: "Card Requests",
    iconD: Icons.transaction,
    group: "Operations",
  },
  {
    id: "clients",
    label: "Clients & Pets",
    iconD: Icons.clients,
    group: "Directory",
  },
  {
    id: "branches",
    label: "Branches",
    iconD: Icons.branch,
    group: "Directory",
  },
  {
    id: "accounts",
    label: "Accounts",
    iconD: Icons.account,
    group: "Directory",
  },
  {
    id: "promotions",
    label: "Promotions",
    iconD: Icons.promo,
    group: "Marketing",
  },
];
