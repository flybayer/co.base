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

export function createClient<SiteDataSchema>(options: ClientOptions) {
  const connectionUseSSL =
    options.connectionUseSSL == null
      ? DEFAULT_USE_SSL
      : options.connectionUseSSL;
  const connectionHost =
    options.connectionHost == null ? DEFAULT_HOST : options.connectionHost;
  const { siteName } = options;

  async function api(endpoint: string, payload: any) {
    return fetchHTTP(
      `http${connectionUseSSL ? "s" : ""}://${connectionHost}/api/${endpoint}`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    ).then(async (res) => {
      const body = await res.json();

      if (res.status !== 200) throw new Error(body.error);

      return body;
    });
  }

  async function fetch(key: keyof SiteDataSchema) {
    const resp = await api("node-get", {
      siteName,
      address: [key],
    });
    if (resp.value === null) {
      throw new Error("value not found");
    }
    const value: SiteDataSchema[typeof key] = resp.value;
    return { value, freshFor: 30 };
  }
  function useNode(
    key: keyof SiteDataSchema,
    preload?: SiteLoad<SiteDataSchema>
  ) {
    type A = SiteDataSchema[keyof SiteDataSchema];
    const preloadedValue = preload?.values[key];
    const [state, setState] = useState<A | undefined>(preloadedValue);
    console.log("USE NODE", { key, siteName, preload });
    useEffect(() => {
      console.log("CLIENT SUBSCRIBE TO ZE VALUE?!", {
        key,
        siteName,
        connectionHost,
        connectionUseSSL,
      });
    }, [siteName, key]);
    return state;
  }
  async function load(query: Record<keyof SiteDataSchema, true>) {
    // in theory this function returns a Promise<SiteLoad<SiteDataSchema>> , but TS seems to disagree
    let freshFor = 60 * 60 * 24;
    const fetchers = PojoMap.entries(query).map(
      async ([queryKey, _probablyTrue]): Promise<
        [
          queryKey: keyof SiteDataSchema,
          resp: SiteDataSchema[keyof SiteDataSchema]
        ]
      > => {
        const resp = await fetch(queryKey);
        if (resp.freshFor < freshFor) {
          freshFor = resp.freshFor;
        }
        return [queryKey, resp.value];
      }
    );
    const resps = await Promise.all(fetchers);
    const values = PojoMap.fromEntries(resps);
    return {
      freshFor,
      values,
    };
  }
  return { fetch, useNode, load };
}
