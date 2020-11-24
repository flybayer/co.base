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
    revalidate: preload.freshFor,
  };
};

export default function Home({ preload }: { preload: AvenCloudLoad }) {
  const pricingPlans = AvenCloud.useNode("pricing-plans", preload);
  console.log({ pricingPlans });

  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>My Rocket Ship App</h1>

        <p>Pricing Plans:</p>
        {pricingPlans.map((t) => (
          <p key={t.key}>
            {t.title} : {t["price-per-month"]}
          </p>
        ))}
      </main>
    </div>
  );
}
