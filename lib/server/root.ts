const ROOT_USERNAME = "root" || process.env.AVEN_ROOT_USER_NAME;
const ROOT_SITENAME = "site" || process.env.AVEN_ROOT_SITE_NAME;

export function isRootUser({ username }: { username: string }): boolean {
  return username === ROOT_USERNAME;
}

export function isRootSite({ name }: { name: string }): boolean {
  return name === ROOT_SITENAME;
}
