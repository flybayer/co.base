import { SiteSchema } from "./SiteSchema";
import { SiteRole } from "./SiteRoles";
import { SiteTokenType } from "./SiteToken";

export type HostOpenEvent = undefined;
export type HostCloseEvent = undefined;
export type SocketConnectEvent = { clientId: number };
export type SocketDisconnectEvent = { clientId: number };
export type HeartbeatEvent = { socketCount: number };
export type SiteReadEvent = {
  siteName: string;
  tag: string;
  userId: null | number;
  tokenId: null | number;
};
export type HostSiteEvent = {
  siteName: string;
  name: SiteEventName;
  userId: null | number;
  tokenId: null | number;
  eventId: number;
};
export type HostEvents = {
  HostOpen: HostOpenEvent;
  HostClose: HostCloseEvent;
  SocketConnect: SocketConnectEvent;
  SocketDisconnect: SocketDisconnectEvent;
  Heartbeat: HeartbeatEvent;
  SiteRead: SiteReadEvent;
  SiteEvent: HostSiteEvent;
};
export type HostEventType = keyof HostEvents;
export type RecordedHostEvent<EvtTypeName extends HostEventType> = {
  type: EvtTypeName;
  event: HostEvents[EvtTypeName];
  time: number; //ms
};

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
  version: number;
};

export type NodeSchemaPutResponse = {
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
  NodeSchemaEdit: NodeSchemaPutResponse;
  NodePost: NodePostResponse;
  NodeDestroy: NodeDestroyResponse;
  SiteNodePost: NodePostResponse;
  SiteNodeDestroy: NodeDestroyResponse;
};

export type SiteEventName = keyof SiteEvent;

export type SiteEventMeta = {
  userId: number | null;
  tokenId: number | null;
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
