import { NextApiRequest, NextApiResponse } from "next";
import { createAPI } from "../../api-utils/createAPI";

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

const APIHandler = createAPI(async (req: NextApiRequest, res: NextApiResponse) => {
  console.log({
    asdf: JSON.stringify(req.body),
  });
  return {
    message: "Thank you, Stripe.",
  };
});

export default APIHandler;
