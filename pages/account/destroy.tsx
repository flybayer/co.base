import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { destroyCookie } from "nookies";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { APIButton } from "../../lib/components/APIButton";
import { BasicSiteLayout } from "../../lib/components/SiteLayout";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return {
    props: {
      user: verifiedUser,
    },
  };
};

export default function DestroyAccountPage({ user }: { user: APIUser }): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <h3>Destroy User Account</h3>
          <p>Are you sure you want to destroy your user account and all sites that you own?</p>
          <APIButton
            endpoint="account-destroy"
            payload={{}}
            colorScheme="red"
            onDone={() => {
              destroyCookie(null, "AvenSession");
              push("/login");
            }}
          >
            Destroy Account
          </APIButton>
        </>
      }
    />
  );
}
