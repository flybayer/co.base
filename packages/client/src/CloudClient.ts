import { PojoMap } from "pojo-maps";
import { useEffect, useState } from "react";
import fetchHTTP from "node-fetch";

const DEFAULT_HOST = "aven.io";
const DEFAULT_USE_SSL = true;

export type SiteLoad<SiteDataSchema> = {
  values: Partial<SiteDataSchema>;
  freshFor: number;
};

type ClientOptions = {
  siteName: string;
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

export function createClient<SiteDataSchema>(options: ClientOptions): AvenClient<SiteDataSchema> {
  const connectionUseSSL = options.connectionUseSSL == null ? DEFAULT_USE_SSL : options.connectionUseSSL;
  const connectionHost = options.connectionHost == null ? DEFAULT_HOST : options.connectionHost;
  const { siteName } = options;

  async function api(endpoint: string, payload: any) {
    return fetchHTTP(`http${connectionUseSSL ? "s" : ""}://${connectionHost}/api/${endpoint}`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      const body = await res.json();
      if (res.status !== 200) throw new AvenError(body.error);
      return body;
    });
  }

  async function fetch<NodeKey extends keyof SiteDataSchema>(
    nodeKey: NodeKey,
  ): Promise<{ value: SiteDataSchema[NodeKey]; freshFor: number }> {
    const resp = await api("node-get", {
      siteName,
      address: String(nodeKey).split("/"),
    });
    if (resp.value === null) {
      throw new Error("value not found");
    }
    const value: SiteDataSchema[NodeKey] = resp.value;
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
