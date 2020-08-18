import stripe from "../../api-utils/stripe";
import { NextApiRequest, NextApiResponse } from "next";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifiedUser";
import redirect from "../../api-utils/redirect";
import getSiteLink from "../../api-utils/getSiteLink";



async function redirectBillingSubscribe(verifiedUser: APIUser | null , res: any) {
  if (!verifiedUser) {
    return {}
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: 'price_0HH0Sg05C7xNwv0sskcjQvt3',
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: getSiteLink('/account/welcome'),
    cancel_url: getSiteLink('/cancel',
    customer_email: verifiedUser.email,
    // customer: verifiedUser.stripeCustomerId,
  });
  console.log("session is", session);
  if (session && session.url) {
    redirect(res, session.url);
  }
}


async function handleAction(req: NextApiRequest, res: NextApiResponse) {
  const verifiedUser = await getVerifiedUser(req);
  if (verifiedUser == null) {
    redirect(res, "/login");
    return {};
  } else {
    return await redirectBillingSubscribe(verifiedUser, res);
  }
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  handleAction(req, res).catch((err) => console.error(err));
};