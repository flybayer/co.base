import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import redirect from "../../api-utils/redirect";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifiedUser";
import stripe from "../../api-utils/stripe";
import getSiteLink from "../../api-utils/getSiteLink";

async function redirectBillingSession(user: APIUser, res: NextApiResponse) {
  let stripeCustomer = user.stripeCustomerId;
  if (!stripeCustomer) {
    const customer = await stripe.customers.create({
      metadata: {
        userId: user.id,
      },
    });
    console.log("updating user", user, customer);
    await database.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customer.id },
    });
    console.log("created customer", customer);
    stripeCustomer = customer.id;
  }
  var session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomer,
    return_url: getSiteLink("/account"),
  });
  console.log("session is", session);
  if (session && session.url) {
    redirect(res, session.url);
  }
  return {};
}

async function handleAction(req: NextApiRequest, res: NextApiResponse) {
  const verifiedUser = await getVerifiedUser(req);
  if (verifiedUser == null) {
    redirect(res, "/login");
    return {};
  } else {
    return await redirectBillingSession(verifiedUser, res);
  }
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  handleAction(req, res).catch((err) => console.error(err));
};
