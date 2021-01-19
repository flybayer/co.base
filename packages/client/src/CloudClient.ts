import fetchHTTP from "node-fetch";
import ReconnectingWebSocket from "reconnecting-websocket";
import { NodeSchema } from "./NodeSchema";
import { useEffect, useState } from "react";

const DEFAULT_HOST = "aven.io";
const DEFAULT_USE_SSL = true;

type SubscribePayload = { t: "sub"; siteName: string; nodeKey: string };
type UnsubscribePayload = { t: "unsub"; siteName: string; nodeKey: string };
type CloudClientSocketPayload = SubscribePayload | UnsubscribePayload;

export type SiteLoad<SiteDataSchema> = {
  values: Partial<SiteDataSchema>;
  freshFor: number;
};

type ClientOptions = {
  siteName: string;
  siteToken?: string;
  connectionHost?: string;
  connectionUseSSL?: boolean;
};

class AvenError extends Error {
  name: string;
  message: string;
  data?: any;
  constructor(detail: { message: string; name: string; data?: any }) {
    super(detail.message);
    this.message = detail.message;
    this.name = detail.name;
    this.data = detail.data;
  }
}

export type AvenClient<SiteDataSchema> = {
  useNodeValue<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
    preload?: SiteLoad<SiteDataSchema>,
  ): undefined | SiteDataSchema[NodeKey];
  load(
    query: Partial<Record<keyof SiteDataSchema, true>>,
  ): Promise<{ freshFor: number; values: Partial<SiteDataSchema> }>;
  open(): void;
  close(): void;
  isConnected(): boolean;
  onIsConnected(handler: (isConnected: boolean) => void): () => void;
};

type NodeCache<SiteDataSchema, NodeKey extends keyof SiteDataSchema> = {
  value?: SiteDataSchema[NodeKey];
  // children?: Record<string, NodeCache>;
  schema?: NodeSchema;
  valueFetchTime?: null | number;
  schemaFetchTime?: null | number;
};
type SiteNodeCache<SiteDataSchema> = Partial<
  Record<keyof SiteDataSchema, NodeCache<SiteDataSchema, keyof SiteDataSchema>>
>;

type SiteNode<NodeKey, NodeSchema> = {
  nodeKey: NodeKey;
  fetch(): Promise<{ value: NodeSchema; freshFor: number }>;
  getValue(): NodeSchema | undefined;
  connect(updater: (state: NodeSchema) => void): () => void;
};

export function createClient<SiteDataSchema>(options: ClientOptions): AvenClient<SiteDataSchema> {
  const connectionUseSSL = options.connectionUseSSL == null ? DEFAULT_USE_SSL : options.connectionUseSSL;
  const connectionHost = options.connectionHost == null ? DEFAULT_HOST : options.connectionHost;
  const { siteName, siteToken } = options;

  const siteNodeCache: SiteNodeCache<SiteDataSchema> = {};

  let ws: ReconnectingWebSocket | null = null;

  // const nodes = Partial<Record<keyof SiteDataSchema, SiteNode<keyof SiteDataSchema,
  const nodes: Partial<
    Record<keyof SiteDataSchema, SiteNode<keyof SiteDataSchema, SiteDataSchema[keyof SiteDataSchema]>>
  > = {};

  async function api(endpoint: string, payload: any, method: "post" | "put" | "delete" | "get" = "post") {
    return fetchHTTP(`http${connectionUseSSL ? "s" : ""}://${connectionHost}/api/${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(siteToken ? { "x-aven-site-token": siteToken } : {}),
      },
      body: method === "get" || method === "delete" ? undefined : JSON.stringify(payload),
    }).then(async (res) => {
      const body = await res.json();
      if (res.status !== 200) throw new AvenError(body.error);
      return body;
    });
  }

  function createSiteNode<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
  ): SiteNode<NodeKey, SiteDataSchema[NodeKey]> {
    let isConnected = false;
    const valueHandlers = new Set<(v: SiteDataSchema[NodeKey]) => void>();

    async function fetch(): Promise<{ value: SiteDataSchema[NodeKey]; freshFor: number }> {
      let nodeCache = siteNodeCache[nodeKey];
      if (!nodeCache) {
        nodeCache = {};
        siteNodeCache[nodeKey] = nodeCache;
      }
      const resp = await api(`s/${siteName}/${nodeKey}`, undefined, "get");
      const value: SiteDataSchema[NodeKey] = resp.value;
      nodeCache.value = value;
      nodeCache.valueFetchTime = Date.now();
      nodeNotifyUpdate(value);
      return { value, freshFor: resp.freshFor };
    }

    function getValue(): SiteDataSchema[NodeKey] | undefined {
      const nodeCache = siteNodeCache[nodeKey];
      if (nodeCache === undefined) return undefined;
      const { value } = nodeCache as NodeCache<SiteDataSchema, NodeKey>;
      if (value === undefined) return undefined;
      return value;
    }

    function connectIfNotConnected(): void {
      if (isConnected) return;
      socketSend({ t: "sub", siteName, nodeKey: nodeKey as string });
      isConnected = true;
    }
    function disconnect(): void {
      if (!isConnected) return;
      socketSend({ t: "unsub", siteName, nodeKey: nodeKey as string });
      isConnected = false;
    }

    function nodeNotifyUpdate(value: SiteDataSchema[NodeKey]): void {
      valueHandlers.forEach((handler) => handler(value));
    }

    function connect(valueHandler: (v: SiteDataSchema[NodeKey]) => void): () => void {
      valueHandlers.add(valueHandler);
      connectIfNotConnected();
      let nodeCache = siteNodeCache[nodeKey] as NodeCache<SiteDataSchema, NodeKey>;
      if (!nodeCache) {
        nodeCache = {};
        siteNodeCache[nodeKey] = nodeCache as NodeCache<SiteDataSchema, NodeKey>;
      }
      if (nodeCache.value === undefined) {
        fetch().catch((e) => {
          console.error("oops!", e);
        });
      }
      return () => {
        valueHandlers.delete(valueHandler);
        if (valueHandlers.size === 0) disconnect();
      };
    }

    return { fetch, getValue, connect, nodeKey };
  }

  function getSiteNode<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
  ): SiteNode<NodeKey, SiteDataSchema[NodeKey]> {
    const cached = nodes[nodeKey];
    if (cached !== undefined) {
      return cached as SiteNode<NodeKey, SiteDataSchema[NodeKey]>;
    }
    const node = createSiteNode(nodeKey);
    nodes[nodeKey] = node;
    return node;
  }
  // async function fetch<NodeKey extends keyof SiteDataSchema>(
  //   nodeKey: NodeKey,
  // ): Promise<{ value: SiteDataSchema[NodeKey]; freshFor: number }> {
  //   let nodeCache = siteNodeCache[nodeKey];
  //   if (!nodeCache) {
  //     nodeCache = {};
  //     siteNodeCache[nodeKey] = nodeCache;
  //   }
  // const address = String(nodeKey).split("/");
  // for (const addressI in address) {
  //   const key = address[addressI];
  // }
  // const resp = await api(`s/${siteName}/${nodeKey}`, undefined, "get");
  // const resp = await api(`s/${nodeKey}`, {
  //   siteName,
  //   address: String(nodeKey).split("/"),
  // });
  // debugger;
  // cache.
  //   console.log("req client3", resp, nodeKey);

  //   if (resp.value === null) {
  //     throw new Error("value not found");
  //   }
  //   const value: SiteDataSchema[NodeKey] = resp.value;
  //   nodeCache.value = value;
  //   nodeCache.valueFetchTime = Date.now();
  //   return { value, freshFor: resp.freshFor };
  // }

  // const DEV_TEST_WS = true;

  function useNodeValue<NodeKey extends keyof SiteDataSchema>(nodeKey: NodeKey, preload?: SiteLoad<SiteDataSchema>) {
    // type NodeType = SiteDataSchema[NodeKey];
    // const preloadedValues = preload?.values;
    // const preloadedValue = preloadedValues && preloadedValues[nodeKey];
    // const [state, setState] = useState<NodeType | undefined>(preloadedValue);

    // const [freshFor, setFreshFor] = useState<number>(preload?.freshFor || 0);

    // useEffect(() => {
    //   if (ws) {
    //     // websocket subscription
    //     console.log("subscribing to....", { nodeKey });
    //   } else {
    //     // polling
    //     const intHandle = setInterval(() => {
    //       fetch(nodeKey)
    //         .then((resp) => {
    //           setState(resp.value);
    //           if (resp.freshFor !== freshFor) setFreshFor(resp.freshFor);
    //         })
    //         .catch((e) => {
    //           console.log(`Error Updating "${nodeKey}"`);
    //           console.error(e);
    //         });
    //     }, freshFor * 1000);

    //     return () => {
    //       clearInterval(intHandle);
    //     };
    //   }
    // }, [siteName, nodeKey, freshFor]);

    // return state;

    const node = getSiteNode(nodeKey);
    const [nodeState, setNodeState] = useState(node.getValue());
    console.log("render nodeState", nodeState);
    useEffect(
      () =>
        node.connect((val) => {
          console.log("connected node has new value!", val);
          setNodeState(val);
        }),
      [],
    );
    return nodeState;
  }

  async function load(
    query: Partial<Record<keyof SiteDataSchema, true>>,
  ): Promise<{ freshFor: number; values: Partial<SiteDataSchema> }> {
    const freshFor = 60 * 60 * 24;
    // const fetchers = PojoMap.entries(query).map(
    //   async ([queryKey, _probablyTrue]): Promise<
    //     [queryKey: keyof SiteDataSchema, resp: SiteDataSchema[keyof SiteDataSchema]]
    //   > => {
    //     const resp = await fetch(queryKey);
    //     if (resp.freshFor < freshFor) {
    //       freshFor = resp.freshFor;
    //     }
    //     return [queryKey, resp.value];
    //   },
    // );
    // const resps = await Promise.all(fetchers);
    // const values = PojoMap.fromEntries(resps) as Partial<SiteDataSchema>;
    return {
      freshFor,
      // values,
      values: {},
    };
  }

  let queuedSocketMessages: Array<CloudClientSocketPayload> | null = [];

  function open(): void {
    console.log("connecting to ", { connectionHost, connectionUseSSL, siteName });
    const wsUrl = `${connectionUseSSL ? "wss" : "ws"}://${connectionHost}/s/${siteName}`;
    ws = new ReconnectingWebSocket(wsUrl);
    ws.onopen = () => {
      _setIsConnected(true);
      console.log("socket opened");
      const openMessageQueue = queuedSocketMessages;
      queuedSocketMessages = null;
      openMessageQueue?.forEach((payload) => socketSend(payload));
    };
    ws.onmessage = (msg: any) => {
      const payload = JSON.parse(msg.data);
      console.log(payload);
      // console.log(msg);
    };
    ws.onclose = () => {
      _setIsConnected(false);
      console.log("socket closed");
      ws = null;
    };

    ws.onerror = (e: any) => {
      console.log("socket errored", e);
      // _setIsConnected(false);
      // ws = null;
    };
  }
  function close(): void {
    console.log("closing token");
    ws && ws.close();
    ws = null;
    queuedSocketMessages = [];
  }

  function socketSend(payload: CloudClientSocketPayload): void {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
      return;
    }
    if (queuedSocketMessages) {
      queuedSocketMessages.push(payload);
      return;
    }
    if (ws) {
      console.error(`Cannot send to socket with ready state ${ws.readyState}..`, payload);
      return;
    }
    console.error("Cannot send to closed socket: ", payload);
    return;
  }

  let isConn = false;
  const isConnectedHandlers = new Set<(isConn: boolean) => void>();
  function _setIsConnected(isConnected: boolean): void {
    isConn = isConnected;
    isConnectedHandlers.forEach((handler) => handler(isConnected));
  }
  function isConnected(): boolean {
    return isConn;
  }
  function onIsConnected(handler: (isConn: boolean) => void): () => void {
    isConnectedHandlers.add(handler);
    return () => {
      isConnectedHandlers.delete(handler);
    };
  }
  return { useNodeValue, load, open, close, isConnected, onIsConnected };
}
