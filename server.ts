import { Response } from "express"
import { createServer } from "http"
import * as dotenv from "dotenv"
import blitz from "blitz/custom-server"
import { parse } from "url"
import WebSocket from "ws"
import express from "express"
import cookieParser from "cookie-parser"
import { testOutput } from "./app/server/TestOutput"
import spawnAsync from "@expo/spawn-async"
import { flushEvents, SERVER_HOST, writeEvent } from "./app/hostEvents/HostEvent"
import { databaseUrl } from "./app/server/Config"
import db from "./db"

dotenv.config()

console.log("YES, executing server.ts")

const dev = process.env.NODE_ENV !== "production"

const app = blitz({ dev, conf: require("./blitz.config.js") })

console.log("Starting Host " + SERVER_HOST)

const defaultPort = dev ? 3001 : 3000
const port = process.env.PORT ? Number(process.env.PORT) : defaultPort

let closeServer: null | (() => Promise<void>) = null

const sockets = new Map<number, WebSocket>()

async function startServer() {
  // await connectNotifications()
  const server = express()
  const handle = app.getRequestHandler()
  server.use(
    express.static(__dirname + "/public", {
      maxAge: "30d",
    })
  )
  server.use(cookieParser())
  server.use((req: any, res: Response) => {
    const parsedUrl = parse(req.url, true)
    return handle(req, res, parsedUrl)
  })
  const httpServer = createServer(server)

  const heartbeatInterval = setInterval(() => {
    writeEvent("Heartbeat", { socketCount: sockets.size })
  }, 30_000)

  closeServer = async () => {
    // fixme: todo: websocket shutdown /disconnections?
    await new Promise<void>((resolve, reject) => {
      clearInterval(heartbeatInterval)
      console.log("Closing HTTP server.")
      httpServer.close()
      const rejectTimeout = setTimeout(() => {
        console.log("HTTP server did not close within 10 seconds!")
        reject(new Error("HTTPCloseError"))
      }, 10_000)
      httpServer.on("close", () => {
        console.log("HTTP server did close.")
        clearTimeout(rejectTimeout)
        resolve()
      })
    })
  }
  const wss = new WebSocket.Server({
    server: httpServer,
  })
  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, () => {
      resolve()
    })
    httpServer.on("error", reject)
  })

  writeEvent("HostOpen", undefined)

  testOutput({ type: "ServerReady", port })
  dev && console.log(`> Ready on http://localhost:${port}`)

  let clientIdCount = 0

  function clientSend(clientId: number, data: any) {
    const socket = sockets.get(clientId)
    if (!socket) {
      throw new Error("no socket with this client id")
    }
    socket.send(JSON.stringify(data))
  }

  function handleMessage(clientId: number, message: any) {
    console.log("=== client msg", clientId, message)
  }

  wss.on("connection", (socket: WebSocket) => {
    const clientId = clientIdCount++
    sockets.set(clientId, socket)
    writeEvent("SocketConnect", { clientId })
    clientSend(clientId, {
      t: "info",
      clientId,
      host: SERVER_HOST,
    })
    socket.on("message", (data: string) => {
      const msg = JSON.parse(data)
      handleMessage(clientId, msg)
    })
    socket.on("close", () => {
      sockets.delete(clientId)
      writeEvent("SocketDisconnect", { clientId })
    })
  })
}
const projectRoot = process.cwd()

async function prepareDockerDev() {
  if (!dev) return
  if (process.env.SKIP_DOCKER) return
  console.log("Docker startup..")
  await spawnAsync("docker-compose", ["-f", "./docker-compose.yml", "up", "-d"], {
    stdio: "inherit",
    cwd: projectRoot,
  })
}

async function prepareDatabase() {
  if (!dev) return
  console.log("Migrating db..")
  await spawnAsync("yarn", ["prisma", "migrate", "dev"], {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      DATABASE_URL: databaseUrl,
      ...process.env,
    },
  })
}

async function runServer() {
  // await prepareDockerDev()
  // await prepareDatabase()
  await app.prepare()
  await startServer()
}

runServer().catch((err) => {
  console.error(err)
})

process.on("SIGHUP", () => {
  console.info("SIGHUP signal received.")
})

process.on("SIGTERM", () => {
  console.info("SIGTERM signal received.")
  ;(async () => {
    writeEvent("HostClose", undefined)
    await flushEvents()
    if (closeServer) await closeServer()
    db.$disconnect()
    // await disconnectNotifications()
  })()
    .then(() => {
      process.exit(0)
    })
    .catch((e) => {
      console.error("Error while shutting down server")
      // good luck finding this error in the production logs, lol!
      console.error(e)
      process.exit(1)
    })
})
