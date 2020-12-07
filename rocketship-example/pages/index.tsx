import Head from "next/head";
import { GetStaticProps } from "next";
import AvenCloud, { AvenCloudLoad } from "../AvenCloud";

export const getStaticProps: GetStaticProps = async (context) => {
  const preload = await AvenCloud.load({
    "pricing-plans": true,
  });
  return {
    props: {
      preload,
    },
    revalidate: preload.freshFor > 1 ? preload.freshFor : 1,
  };
};

export default function Home({ preload }: { preload: AvenCloudLoad }) {
  const pricingPlans = AvenCloud.useNode("pricing-plans", preload);

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
