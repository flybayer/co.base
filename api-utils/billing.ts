import { getLevelOfProductId } from "../data/subscription";
import stripe from "./stripe";
import { database } from "../data/database";
import { APIUser } from "./getVerifedUser";

export interface StripePlan {
  object: "plan";
  product: string;
}
export interface StripeSubscriptionItem {
  object: "subscription_item";
  unit_amount: number; // cents
  plan: StripePlan;
}
export interface StripeSubscription {
  object: "subscription";
  customer: string; // stripe id of customer
  current_period_end: number;
  plan: StripePlan;
  items: {
    object: "list";
    data: Array<StripeSubscriptionItem>;
  };
}
export interface StripeSubscriptionCreatedEvent {
  data: {
    object: StripeSubscription;
  };
}
export interface StripeSubscriptionUpdatedEvent {
  data: {
    object: StripeSubscription;
  };
}
export interface StripeCustomer {
  object: "customer";
  id: string;
  metadata: {
    userId: string;
  };
  subscriptions: {
    data: Array<StripeSubscription>;
  };
}

export async function resetSubscription(user: APIUser) {
  const customer: StripeCustomer = await stripe.customers.retrieve(
    user.stripeCustomerId
  );
  const subscription = customer.subscriptions.data[0];
  if (!subscription) {
    await database.user.update({
      where: { id: user.id },
      data: {
        subscribedAccess: 0,
        subscriptionEndTime: null,
      },
    });
    return;
  }
  const productId = subscription.plan.product;
  const newSubscriptionLevel = getLevelOfProductId(productId);
  await database.user.update({
    where: { id: user.id },
    data: {
      subscribedAccess: newSubscriptionLevel,
      subscriptionEndTime: new Date(subscription.current_period_end * 1000),
    },
  });
  console.log("IZ RESETTING!", { newSubscriptionLevel });
  // console.log(customer);
}

export async function syncSubscription(subscription: StripeSubscription) {
  // a notification from stripe that a subscription has added or changed.
  const productId = subscription.plan.product;
  const newSubscriptionLevel = getLevelOfProductId(productId);
  const customer: StripeCustomer = await stripe.customers.retrieve(
    subscription.customer
  );
  const userId = Number(customer.metadata.userId);
  const user = await database.user.findOne({
    where: { id: userId },
  });
  if (!user) {
    throw new Error(`Failed to get db user with id "${userId}"`);
  }
  // We are going to make sure the user has the highest access level that they have paid for.
  if (user.subscribedAccess > newSubscriptionLevel) {
    // do not save a lower subscribedAccess, but make sure that we reset the subs at the earliest reasonable time.
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    if (
      user.subscriptionEndTime == null ||
      currentPeriodEnd < user.subscriptionEndTime
    )
      await database.user.update({
        where: { id: userId },
        data: {
          subscriptionEndTime: currentPeriodEnd,
        },
      });
  } else {
    // the user's access level is going *up*
    await database.user.update({
      where: { id: userId },
      data: {
        subscribedAccess: newSubscriptionLevel,
        subscriptionEndTime: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  console.log("SUBS UPDATE:", { newSubscriptionLevel, userId });
  console.log(" ");
  console.log(JSON.stringify(customer));
  console.log(JSON.stringify(subscription));
  console.log(" ");
}
