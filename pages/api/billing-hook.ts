import { readSignedWebhook } from "../../api-utils/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "../../api-utils/email";

async function handleAction(req: NextApiRequest, res: NextApiResponse) {
  const signature = req.headers["stripe-signature"];
  const event = readSignedWebhook(req.body, signature);
  await sendEmail(
    "eric@aven.io",
    "WebHook Test",
    JSON.stringify(event, null, 2)
  );
  return {};
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  handleAction(req, res).catch((err) => console.error(err));
};

export const config = {
  api: {
    bodyParser: false,
  },
};
