import stringify from "json-stable-stringify"
import { createHash } from "crypto"

export type JSONValue = boolean | number | string | JSONObject | JSONArray

interface JSONObject {
  [k: string]: JSONValue
}

interface JSONArray extends Array<JSONValue> {}

export async function getChecksum(value: JSONValue): Promise<string> {
  const valueStr = stringify(value)
  var checksummer = createHash("sha256")
  checksummer.update(valueStr)
  const checksum = checksummer.digest("hex")
  return checksum
}
