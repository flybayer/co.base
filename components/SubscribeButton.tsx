import { Button } from "@blueprintjs/core";
import React from "react";

export default function SubscribeButton() {
  const subscribeClick = React.useCallback(() => {
    const getStripe = import("../client-utils/stripe").then(
      (module) => module.stripePromise
    );
    const getCheckoutSession = fetch(
      "/api/billing-subscribe",
      {}
    ).then((resp) => resp.json());
    Promise.all([getStripe, getCheckoutSession])
      .then(([stripe, checkoutSession]) => {
        console.log("ready!!", checkoutSession, stripe);
        if (!stripe) {
          throw Error("Cannot prepare the stripe client");
        }
        return stripe.redirectToCheckout({
          sessionId: checkoutSession.id,
        });
      })
      .then(({ error }) => {
        console.log("done!", error);
      });
    // .then((stripe) => {
    //   console.log("hey hey hoho");
    //   console.log(stripe);

    // });
  }, []);
  return <Button onClick={subscribeClick}>Subscribe</Button>;
}
