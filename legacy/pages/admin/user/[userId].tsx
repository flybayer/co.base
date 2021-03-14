import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../../lib/server/getVerifedUser";
import { BasicSiteLayout } from "../../../lib/components/SiteLayout";
import React, { ReactElement } from "react";
import { authRedirect } from "../../../lib/server/authRedirect";
import { isRootUser } from "../../../lib/server/root";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser || !isRootUser(verifiedUser)) return authRedirect(context);
  console.log(context.query.userId);
  return {
    props: {
      rootUser: verifiedUser,
      subjectUser: null,
    },
  };
};

export default function adminUserPage({
  rootUser,
  subjectUser,
}: {
  rootUser: APIUser;
  subjectUser: null;
}): ReactElement {
  return (
    <BasicSiteLayout
      user={rootUser}
      isDashboard
      content={
        <>
          <h3>You are the admin!</h3>
          {/* <VIPStatusForm user={subjectUser} /> */}
        </>
      }
    />
  );
}
