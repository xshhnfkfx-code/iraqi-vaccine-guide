export type SectionId =
  | "dashboard"
  | "vaccines"
  | "children"
  | "administration"
  | "cold-chain"
  | "vitamins"
  | "microplan"
  | "monitor"
  | "defaulters"
  | "defaulters-chart"
  | "centers"
  | "reports"
  | "settings";

export interface LocalRecord {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  updatedAt: string;
  syncStatus: "pending" | "synced";
}
