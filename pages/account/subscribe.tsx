import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Button } from "@blueprintjs/core";
import SiteLayout from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router from "next/router";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifiedUser";
import Head from "next/head";
import Link from "next/link";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  return {
    props: {
      user: verifiedUser,
    },
  };
};

function userSubscribe(user: APIUser) {
  console.log("lets api!", user);
}

export default function accountPage({ user }: { user: APIUser | null }) {
  return (
    <>
      <Head>
        <title>Subscribe to Contributor</title>
      </Head>
      <SiteLayout
        content={
          <>
            <h2>Subscribe</h2>
            {user ? (
              <Button
                onClick={() => {
                  userSubscribe(user);
                }}
              >
                Subscribe
              </Button>
            ) : (
              <p>
                <Link href="/login">Log in or register</Link> first
              </p>
            )}
          </>
        }
      />
    </>
  );
}
