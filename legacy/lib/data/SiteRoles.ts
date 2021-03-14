export type SiteRole = "admin" | "manager" | "writer" | "reader";

export const SITE_ROLES: Array<{ key: SiteRole; name: string }> = [
  { key: "admin", name: "Administrator" },
  { key: "manager", name: "Manager" },
  { key: "writer", name: "Writer" },
  { key: "reader", name: "Reader" },
];
