import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";

export default (req: NextApiRequest, res: NextApiResponse) => {
  database.user
    .create({
      data: {
        username: req.body.username,
        email: req.body.email,
        name: req.body.name,
      },
    })
    .then((a) => {
      console.log("inserted", a);
      res.statusCode = 200;
      res.send({});
    })
    .catch((err) => {
      console.error(err);
      res.statusCode = 500;
      res.send({});
    });
};
