import { NextApiResponse } from "next";
import { Error400, Error403, Error404 } from "./Errors";

export function apiRespond(res: NextApiResponse, promise: Promise<any>) {
  promise
    .then((resp) => {
      if (resp.isSent) {
        return; // this happens in the case of redirects..
      }
      res.statusCode = 200;
      res.json(resp);
    })
    .catch((err) => {
      console.error(err);
      if (err instanceof Error400) {
        res.statusCode = 400;
      } else if (err instanceof Error403) {
        res.statusCode = 403;
      } else if (err instanceof Error404) {
        res.statusCode = 404;
      } else {
        res.statusCode = 500;
      }
      res.json({ error: err.detail });
    });
}
