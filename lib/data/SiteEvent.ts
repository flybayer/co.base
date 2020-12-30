import { Error400, Error403 } from "../server/Errors";
import { APIUser } from "../server/getVerifedUser";
import { database } from "./database";
import { SiteRole } from "./SiteRoles";
import { SiteSchema } from "./SiteSchema";
import { SiteTokenType } from "./SiteToken";

export type SchemaEditResponse = { schema: SiteSchema };

export type TokenCreateResponse = {
  token: string;
  tokenId: number;
  type: SiteTokenType;
  label: string;
};

export type TokenDestroyResponse = {
  tokenId: number;
};

export type RoleInviteResponse = {
  toEmail: string | null;
  toUserId: number | null;
  role: SiteRole;
  createdEmailValidationId: number | null;
  inviteId: number;
};

export type RoleEditResponse = {
  role: SiteRole | "none";
  userId: number;
};

export type NodeEditResponse = {
  value: any;
};

export type NodeSchemaEditResponse = {
  schema: any;
};

export type NodePostResponse = {
  nodeId: number;
  address: string[];
  key: string;
  value: any;
};

export type NodeDestroyResponse = {
  address: string[];
};

export type SiteEvent = {
  SchemaEdit: SchemaEditResponse;
  TokenCreate: TokenCreateResponse;
  TokenDestroy: TokenDestroyResponse;
  RoleInvite: RoleInviteResponse;
  RoleEdit: RoleEditResponse;
  NodeEdit: NodeEditResponse;
  NodeSchemaEdit: NodeSchemaEditResponse;
  NodePost: NodePostResponse;
  NodeDestroy: NodeDestroyResponse;
  SiteNodePost: NodePostResponse;
  SiteNodeDestroy: NodeDestroyResponse;
};

type SiteEventName = keyof SiteEvent;

type SiteEventMeta = {
  userId?: number;
  nodeId?: number;
  address?: string[];
};

export type RecordedSiteEvent<SiteEventKey extends keyof SiteEvent> = {
  requestTime: Date;
  completeTime: Date;
  siteName: string;
  eventName: SiteEventKey;
  meta: SiteEventMeta;
  payload: SiteEvent[SiteEventKey];
};

async function writeSiteEvent<SiteEventKey extends keyof SiteEvent>({
  meta,
  payload,
  requestTime,
  completeTime,
  eventName,
  siteName,
}: RecordedSiteEvent<SiteEventKey>) {
  await database.siteEvent.create({
    data: {
      user: meta.userId == null ? undefined : { connect: { id: meta.userId } },
      payload,
      eventName,
      site: { connect: { name: siteName } },
      address: meta.address || undefined,
      siteNode: meta.nodeId == null ? undefined : { connect: { id: meta.nodeId } },
      requestTime: requestTime,
      completeTime: completeTime,
    },
  });
}

async function writeSiteEventWithRetries<SiteEventKey extends keyof SiteEvent>(
  event: RecordedSiteEvent<SiteEventKey>,
  retries = 3,
) {
  try {
    await writeSiteEvent(event);
  } catch (e) {
    if (retries <= 0) throw e;
    await writeSiteEventWithRetries(event, retries - 1);
  }
}

function saveSiteEvent<SiteEventKey extends keyof SiteEvent>(event: RecordedSiteEvent<SiteEventKey>) {
  writeSiteEventWithRetries(event, 3)
    .then(() => {
      // event is saved, nothing to do here really.
    })
    .catch((e) => {
      console.error(
        "=== ERROR Saving Site Event ===: " +
          JSON.stringify({
            event,
          }),
      );
    });
}

type SiteAccessRole = "none" | "reader" | "writer" | "manager" | "admin";

const roleOrder: SiteAccessRole[] = ["none", "reader", "writer", "manager", "admin"];

function elevateRole(roleA: SiteAccessRole, roleB: SiteAccessRole): SiteAccessRole {
  const roleIndex = Math.max(roleOrder.indexOf(roleA), roleOrder.indexOf(roleB));
  if (roleIndex === -1) {
    throw new Error("Cannot elevate roles that are not found.");
  }
  return roleOrder[roleIndex];
}

function accessRoleOfSiteEvent(eventType: SiteEventName): SiteAccessRole {
  // reader. reading is not site events, handled in tagSiteRead

  // writer
  if (eventType === "NodeEdit") return "writer";
  if (eventType === "NodePost") return "writer";
  if (eventType === "NodeDestroy") return "writer";

  // manager
  if (eventType === "NodeSchemaEdit") return "manager";
  if (eventType === "SiteNodePost") return "manager";
  if (eventType === "SiteNodeDestroy") return "manager";

  // admin
  if (eventType === "SchemaEdit") return "admin";
  if (eventType === "TokenCreate") return "admin";
  if (eventType === "TokenDestroy") return "admin";
  if (eventType === "RoleEdit") return "admin";
  if (eventType === "RoleInvite") return "admin";
  return "admin";
}

function getRole(r: string): SiteAccessRole {
  if (r === "reader") return r;
  if (r === "writer") return r;
  if (r === "manager") return r;
  if (r === "admin") return r;
  return "none";
}

async function queryPermission(siteName: string, user?: APIUser | null, apiToken?: string) {
  console.log("ppp", { siteName, user, apiToken });
  const siteRolePermission = await database.site.findUnique({
    where: { name: siteName },
    select: {
      owner: { select: { id: true } },
      schema: true,
      SiteRole:
        user == null
          ? false
          : {
              where: { user: { id: user.id } },
              select: { name: true },
            },
      SiteToken: apiToken
        ? {
            where: { token: apiToken },
            select: { type: true },
          }
        : false,
    },
  });
  if (!siteRolePermission) {
    throw new Error400({ name: "SiteNotFound" });
  }
  let accessRole: SiteAccessRole = "none";
  const schema = siteRolePermission.schema as null | SiteSchema;
  if (schema?.isPublicReadable) {
    accessRole = "reader";
  }
  if (user?.id && siteRolePermission.owner.id === user?.id) {
    accessRole = "admin";
  }
  if (siteRolePermission.SiteRole)
    siteRolePermission.SiteRole.forEach((siteRole) => {
      const grantedRole = getRole(siteRole.name);
      accessRole = elevateRole(accessRole, grantedRole);
    });
  if (siteRolePermission.SiteToken)
    siteRolePermission.SiteToken.forEach((siteToken) => {
      if (siteToken.type === "read") {
        accessRole = elevateRole(accessRole, getRole("reader"));
      }
      if (siteToken.type === "write") {
        accessRole = elevateRole(accessRole, getRole("writer"));
      }
    });
  return { accessRole };
}

export async function tagSiteRead(
  siteName: string,
  user: APIUser | null,
  readTag: string,
  apiToken?: string,
): Promise<void> {
  const { accessRole } = await queryPermission(siteName, user, apiToken);
  const accessRoleHeight = roleOrder.indexOf(accessRole);
  if (accessRoleHeight < roleOrder.indexOf("reader")) {
    throw new Error403({ name: "InsufficientPrivilege", data: { accessRole, requiredAccessRole: "reader" } });
  }
  // to do: track the read tag somewhere along with the user/apiToken/"reader". use for rate limiting and usage tracking. cache the auth check somehow maybe
}

export async function startSiteEvent<SiteEventKey extends keyof SiteEvent>(
  eventName: keyof SiteEvent,
  {
    siteName,
    user,
    apiToken,
    address,
    nodeId,
  }: {
    siteName: string;
    user?: APIUser | null;
    apiToken?: string;
    address?: string[];
    nodeId?: number;
  },
): Promise<[(result: SiteEvent[SiteEventKey]) => void, (e: any) => void]> {
  type SE = SiteEvent[SiteEventKey];
  const requestTime = new Date();

  const { accessRole } = await queryPermission(siteName, user, apiToken);

  const requiredAccessRole = accessRoleOfSiteEvent(eventName);
  const requiredAccessRoleHeight = roleOrder.indexOf(requiredAccessRole);
  const accessRoleHeight = roleOrder.indexOf(accessRole);
  if (accessRoleHeight < requiredAccessRoleHeight) {
    throw new Error403({ name: "InsufficientPrivilege", data: { accessRole, requiredAccessRole } });
  }
  function resolve(eventResult: SE): void {
    saveSiteEvent({
      eventName,
      meta: {
        userId: user?.id,
        address,
        nodeId,
      },
      requestTime,
      completeTime: new Date(),
      siteName,
      payload: eventResult,
    });
  }
  function reject(error: any): void {
    console.log("action failed!", error);
  }
  return [resolve, reject];
}
