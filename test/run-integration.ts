import spawnAsync from "@expo/spawn-async";
import { ChildProcess, spawn } from "child_process";
import { parse } from "dotenv";
import { readFileSync } from "fs-extra";
import { join } from "path";

const envFile = readFileSync(__dirname + "/.test.env", { encoding: "utf8" });
const testEnvVars = parse(envFile);
const testEnv = { ...process.env, ...testEnvVars };

async function delay(duration: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}
async function migrateDB() {
  await spawnAsync("yarn", ["prisma", "migrate", "deploy", "--preview-feature"], {
    env: { ...process.env, DATABASE_URL: testEnv.DATABASE_URL },
    stdio: "inherit",
  });
}

export default async function runIntegration(): Promise<void> {
  await spawnAsync("docker-compose", ["-f", join(__dirname, "test-docker-compose.yml"), "down", "-v"], {
    stdio: "inherit",
  });
  await spawnAsync("docker-compose", ["-f", join(__dirname, "test-docker-compose.yml"), "up", "-d"], {
    stdio: "inherit",
  });
  await delay(500); // fast computers take about this long to start up postgres. the migrate fails without this delay.
  try {
    await migrateDB();
  } catch (e) {
    console.log("First migration attempt failed- database may still be starting. Will retry in 3s...");
    await delay(3000);
    await migrateDB();
  }

  let server: ChildProcess | null = null;

  const serverEvents = [];
  const serverEventListeners = new Set<(h: any) => void>();

  await new Promise<void>((resolve, reject) => {
    function handleEvent(evt: any) {
      if (evt.type === "ServerReady") {
        resolve();
        serverEventListeners.delete(handleEvent);
      }
    }
    server = spawn("yarn", ["start"], {
      cwd: join(__dirname, ".."),
      env: testEnv,
    });

    server.stdout?.on("data", (data) => {
      const lines = Buffer.from(data).toString("utf8").split(/\r?\n/);
      for (const lineI in lines) {
        const line = lines[lineI];
        try {
          const evt = JSON.parse(line.trim());
          console.log("Server Event: ", evt);
          serverEventListeners.forEach((handler) => {
            handler(evt);
          });
          serverEvents.push(evt);
        } catch (e) {
          console.log(`server stdout:\n${data}`);
        }
      }
    });

    server.stderr?.on("data", (data) => {
      console.error(`Server Error:\n\n${data}`);
    });
    server.on("exit", function (code, signal) {
      console.log("server process exited with " + `code ${code} and signal ${signal}`);
    });

    serverEventListeners.add(handleEvent);
    setTimeout(() => {
      reject(new Error("server start timeout"));
    }, 10 * 1000);
  });

  let slowTestTimeout: NodeJS.Timeout | null = null;

  await Promise.race([
    spawnAsync("yarn", ["jest", "integration"], { stdio: "inherit", env: testEnv }),
    new Promise<void>((_, reject) => {
      slowTestTimeout = setTimeout(() => {
        console.log("reached test timeout");
        reject(new Error("Test Timeout."));
      }, 120_000);
    }),
  ]);

  slowTestTimeout && clearTimeout(slowTestTimeout);

  console.log("Closing server.");
  server && (server as ChildProcess).kill(); // wtf typescript

  console.log("Closing docker containers..");
  await spawnAsync("docker-compose", ["-f", join(__dirname, "test-docker-compose.yml"), "down", "-v"], {
    stdio: "inherit",
  });
}

if (module === require.main) {
  runIntegration()
    .then(() => {
      console.log("Integration suite done.");

      // console.log("Active Requests: ", (process as any)._getActiveRequests());
      // console.log("Active Handles: ", (process as any)._getActiveHandles());
      process.exit(0);
    })

    .catch((err) => {
      console.error("Integration suite error.");
      console.error(err);
      process.exit(1);
    });
}
