import Head from "next/head";
import { GetStaticProps } from "next";
import Cloud, { CloudLoad } from "../Cloud-rocketship-Generated";

import { ReactElement } from "react";

export const getStaticProps: GetStaticProps = async (context) => {
  console.log("ok here goes");
  const preload = await Cloud.load({
    "pricing-plans": true,
  });
  return {
    props: {
      preload,
    },
    revalidate: preload.freshFor > 1 ? preload.freshFor : 1,
  };
};

export default function Home({ preload }: { preload: CloudLoad }): ReactElement {
  const pricingPlans = Cloud.useNode("pricing-plans", preload);

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>My Rocket Ship App</h1>

        <p>Pricing Plans:</p>
        {pricingPlans.map((pricingPlan) => (
          <p key={pricingPlan.key}>
            {pricingPlan.title} : {pricingPlan["price-per-month"]}
          </p>
        ))}
      </main>
    </div>
  );
}
