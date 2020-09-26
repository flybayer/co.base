import { NextApiRequest, NextApiResponse } from "next";
import { setAnyCors } from "../../api-utils/cors";

const cities = require("all-the-cities");

interface City {
  name: string;
  population: number;
}
export default (req: NextApiRequest, res: NextApiResponse) => {
  setAnyCors(req, res);
  const { name } = req.query;
  const exp = new RegExp(String(name), "i");
  const filtered = cities.filter((city: City) => city.name.match(exp));
  const sorted = filtered.sort((a: City, b: City) => {
    return b.population - a.population;
  });
  const limited = sorted.slice(0, 50);
  res.send(JSON.stringify({ name: String(name), cities: limited }));
};
