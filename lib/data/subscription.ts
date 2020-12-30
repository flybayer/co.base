import { Error500 } from "../server/Errors";
import { PojoMap } from "pojo-maps";

export enum SubscriptionLevel {
  None,
  Developer,
  Business,
  Pro,
}

export function getSubscriptionLevelName(level: SubscriptionLevel): string {
  switch (level) {
    case SubscriptionLevel.Developer:
      return "Developer";
    case SubscriptionLevel.Business:
      return "Business";
    case SubscriptionLevel.Pro:
      return "Pro";
    default:
      return "Unknown";
  }
}

const STRIPE_PRODUCTS_DEV: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Developer]: "prod_HsOAaLiTYtEGa3",
  [SubscriptionLevel.Business]: "prod_HsO9bFB0NmddAA",
  [SubscriptionLevel.Pro]: "prod_HsO9bFB0NmddAA",
};

const STRIPE_PRODUCTS_LIVE: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Developer]: "prod_HqholNZ7iREoQb",
  [SubscriptionLevel.Business]: "prod_Hqhp6Fnl9hGEAa",
  [SubscriptionLevel.Pro]: "prod_HqhsSpoi7JE4kA",
};

const STRIPE_PRICES_LIVE: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Developer]: "price_0HH0OV05C7xNwv0sRGr8iGBD",
  [SubscriptionLevel.Business]: "price_0HH0Q205C7xNwv0s3hhBYypY",
  [SubscriptionLevel.Pro]: "price_0HH0Sg05C7xNwv0sskcjQvt3",
};

const STRIPE_PRICES_DEV: PojoMap<SubscriptionLevel, string> = {
  [SubscriptionLevel.None]: "",
  [SubscriptionLevel.Developer]: "price_0HIdNr05C7xNwv0sWxrtaG5p",
  [SubscriptionLevel.Business]: "price_0HIdNH05C7xNwv0skHTdLOgr",
  [SubscriptionLevel.Pro]: "price_0HHBXS05C7xNwv0sUvV4EcJc",
};

const dev = process.env.NODE_ENV !== "production";
const stripeProducts = dev ? STRIPE_PRODUCTS_DEV : STRIPE_PRODUCTS_LIVE;
const stripePrices = dev ? STRIPE_PRICES_DEV : STRIPE_PRICES_LIVE;
const stripeProductEntries = PojoMap.entries(stripeProducts);

export function getPriceIdOfSubscriptionLevel(level: SubscriptionLevel): string {
  const plan = stripePrices[level];
  if (plan) {
    return plan;
  }
  throw new Error500({ message: "Unknown Product", name: "UnknownProduct" });
}

export function getLevelOfProductId(productId: string): SubscriptionLevel {
  const entry = stripeProductEntries.find(([_, p]: [SubscriptionLevel, string]) => p === productId);
  if (entry) {
    return Number(entry[0]);
  }
  throw new Error500({ message: "Product not found!", name: "UnknownProduct" });
}
