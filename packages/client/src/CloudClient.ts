import { PojoMap } from "pojo-maps";
import { useEffect, useState } from "react";
import fetchHTTP from "node-fetch";
import { NodeSchema } from "../../../lib/data/NodeSchema";

const DEFAULT_HOST = "aven.io";
const DEFAULT_USE_SSL = true;

export type SiteLoad<SiteDataSchema> = {
  values: Partial<SiteDataSchema>;
  freshFor: number;
};

type ClientOptions = {
  siteName: string;
  siteToken: string;
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

type AvenClient<SiteDataSchema> = {
  fetch<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
  ): Promise<{ value: SiteDataSchema[NodeKey]; freshFor: number }>;
  useNode<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
    preload?: SiteLoad<SiteDataSchema>,
  ): undefined | SiteDataSchema[NodeKey];
  load(
    query: Partial<Record<keyof SiteDataSchema, true>>,
  ): Promise<{ freshFor: number; values: Partial<SiteDataSchema> }>;
};

console.log("REquired CLIENT 1");

type NodeCache<SiteDataSchema, NodeKey extends keyof SiteDataSchema> = {
  value?: SiteDataSchema[NodeKey];
  // children?: Record<string, NodeCache>;
  schema?: NodeSchema;
  valueFetchTime?: null | number;
  schemaFetchTime?: null | number;
};
type SiteNodeCache<SiteDataSchema> = PartialRecord<
  keyof SiteDataSchema,
  NodeCache<SiteDataSchema, keyof SiteDataSchema>
>;
type PartialRecord<K extends string | number | symbol, V> = Partial<Record<K, V>>;

export function createClient<SiteDataSchema>(options: ClientOptions): AvenClient<SiteDataSchema> {
  const connectionUseSSL = options.connectionUseSSL == null ? DEFAULT_USE_SSL : options.connectionUseSSL;
  const connectionHost = options.connectionHost == null ? DEFAULT_HOST : options.connectionHost;
  const { siteName, siteToken } = options;

  const siteNodeCache: SiteNodeCache<SiteDataSchema> = {};

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

  async function fetch<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
  ): Promise<{ value: SiteDataSchema[NodeKey]; freshFor: number }> {
    let nodeCache = siteNodeCache[nodeKey];
    if (!nodeCache) {
      nodeCache = {};
      siteNodeCache[nodeKey] = nodeCache;
    }
    // const address = String(nodeKey).split("/");
    // for (const addressI in address) {
    //   const key = address[addressI];
    // }
    const resp = await api(`s/${siteName}/${nodeKey}`, undefined, "get");
    // const resp = await api(`s/${nodeKey}`, {
    //   siteName,
    //   address: String(nodeKey).split("/"),
    // });
    // debugger;
    // cache.
    console.log("req client3", resp, nodeKey);

    if (resp.value === null) {
      throw new Error("value not found");
    }
    const value: SiteDataSchema[NodeKey] = resp.value;
    nodeCache.value = value;
    nodeCache.valueFetchTime = Date.now();
    return { value, freshFor: resp.freshFor };
  }

  function useNode<NodeKey extends keyof SiteDataSchema>(nodeKey: NodeKey, preload?: SiteLoad<SiteDataSchema>) {
    type NodeType = SiteDataSchema[NodeKey];
    const preloadedValues = preload?.values;
    const preloadedValue = preloadedValues && preloadedValues[nodeKey];
    const [state, setState] = useState<NodeType | undefined>(preloadedValue);

    const [freshFor, setFreshFor] = useState<number>(preload?.freshFor || 0);

    useEffect(() => {
      const intHandle = setInterval(() => {
        fetch(nodeKey)
          .then((resp) => {
            setState(resp.value);
            if (resp.freshFor !== freshFor) setFreshFor(resp.freshFor);
          })
          .catch((e) => {
            console.log(`Error Updating "${nodeKey}"`);
            console.error(e);
          });
      }, freshFor * 1000);

      return () => {
        clearInterval(intHandle);
      };
    }, [siteName, nodeKey, freshFor]);

    return state;
  }

  async function load(
    query: Partial<Record<keyof SiteDataSchema, true>>,
  ): Promise<{ freshFor: number; values: Partial<SiteDataSchema> }> {
    let freshFor = 60 * 60 * 24;
    const fetchers = PojoMap.entries(query).map(
      async ([queryKey, _probablyTrue]): Promise<
        [queryKey: keyof SiteDataSchema, resp: SiteDataSchema[keyof SiteDataSchema]]
      > => {
        const resp = await fetch(queryKey);
        if (resp.freshFor < freshFor) {
          freshFor = resp.freshFor;
        }
        return [queryKey, resp.value];
      },
    );
    const resps = await Promise.all(fetchers);
    const values = PojoMap.fromEntries(resps) as Partial<SiteDataSchema>;
    return {
      freshFor,
      values,
    };
  }

  return { fetch, useNode, load };
}
