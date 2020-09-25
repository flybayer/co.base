import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";

const cache: any = {};

let lastUpdate = null;

async function updateCache() {
  const res = await fetch("https://www.purpleair.com/json", {});
  const data = await res.json();
  if (res.status === 200) {
    lastUpdate = Date.now();
    data.results.forEach((result: any) => {
      const { Lat, Lon, ID } = result;
      const lat = Math.floor(Lat);
      const lon = Math.floor(Lon);
      const latCache = cache[lat] || (cache[lat] = {});
      const cell = latCache[lon] || (latCache[lon] = {});
      cell[ID] = result;
    });
  } else {
    console.error("Error during fetch!");
    console.error(data);
  }
}

updateCache()
  .then(() => {
    console.log("purple cache initially updated");
  })
  .catch((e) => {
    console.error(e);
  });

setInterval(() => {
  updateCache()
    .then(() => {
      console.log("purple cache updated");
    })
    .catch((e) => {
      console.error(e);
    });
}, 15 * 60 * 60 * 1000);

const cors = Cors({
  methods: ["GET", "HEAD"],
  origin: "*",
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  middleware: any
) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  runMiddleware(req, res, cors);
  const { lat, lon } = req.query;
  const latCache = cache[String(lat)];
  const cell = latCache && latCache[String(lon)];
  res.send(JSON.stringify({ lat, lon, results: cell }));
};
