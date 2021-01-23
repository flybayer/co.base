import fetchHTTP from "node-fetch";
import os from "os";
import * as JSTT from "json-schema-to-typescript";
import { mkdirp, writeFile, readFile } from "fs-extra";
import openBrowser from "react-dev-utils/openBrowser";
import open from "open";
import minimist from "minimist";

class AvenError extends Error {
  name: string;
  message: string;
  data?: any;
  constructor(detail: { message: string; name: string; data?: any }) {
    super(detail?.message || "Unknown Error");
    this.message = detail.message;
    this.name = detail.name;
    this.data = detail.data;
  }
}

async function api(
  remoteHost: string,
  remoteSSL: boolean,
  endpoint: string,
  payload: any,
  method: "post" | "get" = "post",
  authToken?: string,
) {
  return fetchHTTP(`http${remoteSSL ? "s" : ""}://${remoteHost}/api/${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { "x-aven-user-token": authToken } : {}),
    },
    body: method === "get" ? undefined : JSON.stringify(payload),
  }).then(async (res) => {
    const body = await res.json();
    if (res.status !== 200) {
      console.error("wayoy", res.status, body);
      throw new AvenError(body.error);
    }
    return body;
  });
}

type ShellConfig = {
  remoteHost: string;
  remoteSSL: boolean;
  username?: string;
  authToken?: string;
  deviceName?: string;
};

const DEFAULT_SHELL_CONFIG: ShellConfig = {
  remoteHost: "aven.io",
  remoteSSL: true,
};

const SHELL_CONFIG_PATH = `${os.homedir()}/.config/aven`;

async function getShellConfigPath(): Promise<string> {
  await mkdirp(SHELL_CONFIG_PATH);
  return SHELL_CONFIG_PATH;
}

async function getShellConfig(): Promise<ShellConfig> {
  const shellPath = await getShellConfigPath();
  const configFilePath = `${shellPath}/AvenShellConfig.json`;
  try {
    const configData = await readFile(configFilePath, { encoding: "utf8" });
    const config = JSON.parse(configData);
    return config;
  } catch (e) {
    return DEFAULT_SHELL_CONFIG;
  }
}

async function writeShellConfig(config: ShellConfig): Promise<void> {
  const shellPath = await getShellConfigPath();
  const configFilePath = `${shellPath}/AvenShellConfig.json`;
  await writeFile(configFilePath, JSON.stringify(config, null, 2));
}

async function logout(): Promise<void> {
  const { remoteHost, remoteSSL, authToken } = await getShellConfig();
  await api(remoteHost, remoteSSL, "device-destroy", { token: authToken });
  await writeShellConfig({ remoteHost, remoteSSL });
}

async function doLogin(config: ShellConfig): Promise<ShellConfig> {
  const { remoteHost, remoteSSL } = config;
  if (config.username) {
    throw new Error(
      `Already logged in as "${config.username}". Please run the logout command if you want to log in again.`,
    );
  }
  const { token } = await api(remoteHost, remoteSSL, "device-login", {});
  const hostName = os.hostname();
  const openURL = `http${remoteSSL ? "s" : ""}://${remoteHost}/login/device?t=${token}&name=${hostName}`;
  console.log(`To Log in, continue at: ${openURL}`);
  if (!openBrowser(openURL)) {
    open(openURL);
  }

  const { username, deviceName } = await new Promise((resolve, reject) => {
    let queryTimeout: null | NodeJS.Timeout = null;
    let loginTimeout: null | NodeJS.Timeout = null;
    function scheduleQuery() {
      queryTimeout && clearTimeout(queryTimeout);
      queryTimeout = setTimeout(() => {
        queryTimeout && clearTimeout(queryTimeout);
        api(remoteHost, remoteSSL, "device-login-verify", { token })
          .then((resp) => {
            const { isApproved, name, username } = resp;
            if (isApproved) {
              loginTimeout && clearTimeout(loginTimeout);
              resolve({ username, deviceName: name });
            } else {
              scheduleQuery();
            }
          })
          .catch((e) => {
            scheduleQuery();
          });
      }, 5_000);
    }
    scheduleQuery();
    loginTimeout = setTimeout(() => {
      console.log("timed out!!");
      queryTimeout && clearTimeout(queryTimeout);
      reject(new Error("login timeout"));
    }, 60 * 60 * 1000);
  });

  const newConfig = {
    remoteHost,
    remoteSSL,
    username,
    deviceName,
    authToken: token,
  };
  await writeShellConfig(newConfig);

  console.log(`Logged in as "${username}". Device registered as "${deviceName}" `);

  return newConfig;
}

async function getAuthenticateShellConfig(): Promise<ShellConfig> {
  const config = await getShellConfig();
  if (!config.username || !config.authToken) {
    return await doLogin(config);
  }
  return config;
}

export async function pull(siteName: string): Promise<any> {
  const { remoteHost, remoteSSL, authToken, deviceName, username } = await getAuthenticateShellConfig();
  const { nodes, schema } = await api(remoteHost, remoteSSL, `v1/${siteName}/_schema`, { siteName }, "get", authToken);
  // schema.isPublic tells us if an API key is needed..
  const allRecords: any = {};
  for (const nodeKey in nodes) {
    const node = nodes[nodeKey];
    if (node?.type === "record") {
      allRecords[nodeKey] = node;
    } else {
      console.error({ e: 111, nodeKey, node, time: Date.now() });
      throw new Error(`Cannot handle schema type of "${nodeKey}" `);
    }
  }
  const moduleExports = [];
  const definedTypes: any = {};
  for (const recordKey in allRecords) {
    const record = allRecords[recordKey];
    const typeDef = await JSTT.compile(record.record, recordKey, {
      bannerComment: "",
    });
    const typeKeyMatch = typeDef.match(/^export type (.*) =/);
    const typeKey = typeKeyMatch && typeKeyMatch[1];
    if (!typeKey) {
      console.error({ e: 112, typeDef, record, recordKey });
      throw new Error("Failed ts compilation");
    }
    definedTypes[recordKey] = typeKey;

    moduleExports.push(typeDef);
  }
  moduleExports.push(`
export type SiteSchema = {
${Object.entries(definedTypes)
  .map(([recordKey, typeKey]) => `  "${recordKey}": ${typeKey};`)
  .join("\n")}
}`);
  moduleExports.push(`
const Cloud = createClient<SiteSchema>({
  siteName: "${siteName}",
});
export default Cloud;
`);
  moduleExports.push(`
export type CloudLoad = SiteLoad<SiteSchema>;
`);
  const genFile = `
/* tslint:disable */

/**
 * This file was automatically generated by Aven CLI.
 * DO NOT MODIFY IT BY HAND. Instead, modify the Aven Cloud schema and re-run 'aven pull'
 */

import { createClient, SiteLoad } from "@aven/client";

${moduleExports.join("\n")}
`;
  const genFileLocation = `Cloud-${siteName}-Generated.ts`;
  await writeFile(genFileLocation, genFile);
  return { genFile, genFileLocation, definedTypes };
}

export function handleCli(argv: string[]): void {
  const args: CLIArgs = minimist(argv.slice(2));
  if (args.h === true) {
    console.log(`
Aven CLI tool

Usage:
aven pull SITE_NAME

        `);
  }

  const action = args._[0];
  if (action === "pull") {
    pull(args._[1])
      .then(({ definedTypes, genFileLocation, exportedInterfaces, genFile }) => {
        console.log(`Pulled ${Object.entries(definedTypes).length} properties to ${genFileLocation}`);
      })
      .catch(cliHandleFatal);
    return;
  } else if (action === "login") {
    getShellConfig()
      .then((config) => doLogin(config))
      .catch(cliHandleFatal);
    return;
  } else if (action === "logout") {
    logout().catch(cliHandleFatal);
    return;
  }
  console.log("Command not found. Try -h");
  return;
}

if (require.main === module) {
  handleCli(process.argv);
}

function cliHandleFatal(e: Error) {
  console.error(e.message);
  process.exit(1);
}

type CLIArgs = {
  _: string[];
  h?: boolean;
};
