import { JSONValue } from "./checksum"

type GetQuery = {
  getValue?: boolean // defaults true. other fields defaults to false/null
  namedLinks?:
    | boolean
    | {
        after: string // address
      }
}

export type GraphClient = {
  get: (address: string, q: GetQuery) => Promise<{ value: JSONValue }>
  // put: async => {}
  // patch: async => {} 2
  // post: async => {}
}

let startingGraphClient: null | Promise<GraphClient> = null
let graphClient: null | GraphClient = null

async function initGraphClient(): Promise<GraphClient> {
  async function get(address: string, q: GetQuery) {
    return { value: "Something, eyeah" }
  }
  return {
    get,
  }
}

export function getGraphClient(): Promise<GraphClient> {
  if (graphClient) return Promise.resolve(graphClient)
  if (startingGraphClient) return startingGraphClient
  startingGraphClient = initGraphClient()
    .then((client) => {
      graphClient = client
      return client
    })
    .finally(() => {
      startingGraphClient = null
    })
  return startingGraphClient
}

export function startGraphClient() {
  getGraphClient()
}
