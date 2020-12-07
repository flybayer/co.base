import { NextApiRequest, NextApiResponse } from "next";
import { setAnyCors } from "../../api-utils/cors";
import cities from "all-the-cities";

const cache: any = {};
const idCache: any = {};
let cityCache: any = {};

let lastUpdate: number | null = null;

async function updateCache() {
  const res = await fetch("https://www.purpleair.com/json", {});
  const json = await res.text();
  const data = JSON.parse(json);
  if (res.status === 200) {
    lastUpdate = Date.now();
    data.results.forEach((result: any) => {
      const { Lat, Lon, ID } = result;
      const lat = Math.floor(Lat);
      const lon = Math.floor(Lon);
      const latCache = cache[lat] || (cache[lat] = {});
      const cell = latCache[lon] || (latCache[lon] = {});
      cell[ID] = result;
      idCache[ID] = result;
    });
    cityCache = {}; // we have to assume all city results have changed. cities will only be cached for as long as the other cache, but at least we will not leak memory
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

function getCity(id: number) {
  if (!lastUpdate) {
    return null;
  }
  const cached = cityCache[id];
  if (cached) return cached;
  const city = cities.find((c: any) => c.cityId === id);
  if (!city) throw new Error("City not found");
  const lon = city.loc.coordinates[0];
  const lat = city.loc.coordinates[1];
  const sensors = [];
  const readingsTempF = [];
  const readingsHumidity = [];
  const readingsPM2_5 = [];
  const readingsPressure = [];
  for (const sensorId in idCache) {
    const sensor = idCache[sensorId];
    if (sensor.DEVICE_LOCATIONTYPE !== "inside") {
      const sensorLat = sensor.Lat;
      const sensorLon = sensor.Lon;
      const distanceLat = lat - sensorLat;
      const distanceLon = lon - sensorLon;
      const distance = Math.sqrt(distanceLat ** 2 + distanceLon ** 2); // thanks pythagorea. by squaring these values we also are getting the absolute value, all positive baby.
      // Each degree of latitude is approximately 69 miles (111 kilometers) apart.
      // https://www.thoughtco.com/degree-of-latitude-and-longitude-distance-4070616
      // so here we have chosen to use a radius of .5, assuming that each city includes ~55km radius.
      if (distance < 0.5) {
        sensors.push(sensor);
        if (sensor.temp_f) readingsTempF.push(Number(sensor.temp_f));
        if (sensor.humidity) readingsHumidity.push(Number(sensor.humidity));
        if (sensor.PM2_5Value) readingsPM2_5.push(Number(sensor.PM2_5Value));
        if (sensor.totalPM2_5) readingsPressure.push(Number(sensor.totalPM2_5));
        if (sensor.pressure) readingsPressure.push(Number(sensor.pressure));
      }
    }
  }
  const computedCity = {
    lat,
    lon,
    sensorCount: sensors.length,
    avgTempF: readingsTempF.reduce((prev, v) => prev + v, 0) / readingsTempF.length,
    avgHumidity: readingsHumidity.reduce((prev, v) => prev + v, 0) / readingsHumidity.length,
    avgPM2_5: readingsPM2_5.reduce((prev, v) => prev + v, 0) / readingsPM2_5.length,
    avgPressure: readingsPressure.reduce((prev, v) => prev + v, 0) / readingsPressure.length,
    sensors,
    ...city,
  };
  cityCache[id] = computedCity;
  return computedCity;
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  setAnyCors(req, res);
  const { lat, lon, city: cityId } = req.query;
  if (cityId) {
    const city = getCity(Number(cityId));
    res.send(JSON.stringify(city));
    return;
  }
  const latCache = cache[String(lat)];
  const cell = latCache && latCache[String(lon)];
  res.send(JSON.stringify({ lat, lon, results: cell }));
};
