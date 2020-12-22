import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../api-utils/createAPI";
import Serialize from "php-serialize";
import crypto from "crypto";

const paddlePublicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvKl5MsOihG1ytxWIBCDv
K2z/vCBPgJNcntJN4pnWwcZddziNXCTe1tsLXjrEWH5dgbZkUhEhnlcYpL7mgq+Q
1N5LcAy8ojM40bZ8o7K/qgOWVH4aOlUB1raFEWwvRW3ki/FrAgzPZd/0kU+dxili
qelt8WqwixmXKcTbJiyJSTlG+FApkHuwaCq2AJlrg5/MqlTQu9spbtB4ySbUteW0
2pUgXmerZdbx+5bblUj43INgrvDu4CxVaQahjz72M7AU4VjhLlMl0imfAzc1JJUX
m2Pi9vcakPMPLX01OX/2le4deRZxJ7KL3kXjD8LlBXqw++dTxpWe2hQWBT/9S42p
tm97FXoswjb3kQmJ5GvWunnKh4iS3fNMa5BtCFWEP6ApMh5KP57GeN0oJDQIcDCt
0qvg92xqBnzm49EfShWKBCkoXrEfg5n7WvHAAZ3McrGdY1I3e9bDBs7wpr7ifssy
Wgz5ERppXE4Ns9Hxp3SAkUvG4ME+vpb+VMwl7/r8ptT+LC1j1ilyTSawgmu6XWQI
QpUL/O4IgzjKfzqBuIfYK+/MN8aDWMLlNlPB6xoalz3W0P44UrY38DMT7Zy9sbG2
ooG6OUZYbHYZ8JlzFlwqd366JcZf4BjtmTtFJW+TyWkgNi42VoPoWAThDyFkZcDL
ekv3Jr+ke7fGhNEGOBbpOm8CAwEAAQ==
-----END PUBLIC KEY-----`;

function ksort(obj: any) {
  const keys = Object.keys(obj).sort();
  const sortedObj: any = {};
  for (const i in keys) {
    sortedObj[keys[i]] = obj[keys[i]];
  }
  return sortedObj;
}
// from https://developer.paddle.com/webhook-reference/verifying-webhooks
function validateWebhook(payload: any): boolean {
  const mySig = Buffer.from(payload.p_signature, "base64");
  delete payload.p_signature;
  payload = ksort(payload);
  for (const property in payload) {
    if (payload.hasOwnProperty(property) && typeof payload[property] !== "string") {
      if (Array.isArray(payload[property])) {
        payload[property] = payload[property].toString();
      } else {
        payload[property] = JSON.stringify(payload[property]);
      }
    }
  }
  const serialized = Serialize.serialize(payload);
  const verifier = crypto.createVerify("sha1");
  verifier.update(serialized);
  verifier.end();
  const verification = verifier.verify(paddlePublicKey, mySig);
  return verification;
}

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  const isVerified = validateWebhook(req.body);
  console.log({
    asdf: JSON.stringify(req.body),
    isVerified,
  });
  return {
    message: "Thank you, Paddle.",
  };
});

export default APIHandler;
