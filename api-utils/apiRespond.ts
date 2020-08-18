import { NextApiResponse } from "next";
import { Error400, Error403, Error404 } from "./Errors";

export function apiRespond(res: NextApiResponse, promise: Promise<any>) {
  promise
    .then((resp) => {
      res.statusCode = 200;
      res.send(resp);
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
      res.send({ error: err.detail });
    });
}
