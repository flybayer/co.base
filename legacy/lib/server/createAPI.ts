import { NextApiRequest, NextApiResponse } from "next";
import { Error400, Error403, Error404 } from "./Errors";

export function createAPI(asyncHandler: (req: NextApiRequest, res: NextApiResponse) => Promise<any>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await asyncHandler(req, res)
      .then((resp) => {
        if (resp === res) {
          // The API Convention is to return the response if it has been manually handled
          // Useful for redirects, 404, and other non-JSON-200 responses
          return;
        }
        res.statusCode = 200;
        res.json(resp);
      })
      .catch((err) => {
        if (err instanceof Error400) {
          res.statusCode = 400;
        } else if (err instanceof Error403) {
          res.statusCode = 403;
        } else if (err instanceof Error404) {
          res.statusCode = 404;
        } else {
          // Stay quiet until a 500 or unknown error occurs, which are truly unexpected.
          console.error(err);
          res.statusCode = 500;
        }
        res.json({ error: err.detail }); // todo: better handling of metadata from error objects
      });
  };
}
