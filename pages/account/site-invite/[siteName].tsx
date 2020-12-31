import { GetServerSideProps } from "next";
import { ReactElement } from "react";
import getVerifiedUser, { APIUser } from "../../../lib/server/getVerifedUser";
import { MainSection } from "../../../lib/components/CommonViews";
import { BasicSiteLayout } from "../../../lib/components/SiteLayout";
import { SiteRoleAcceptButton } from "../../../lib/components/SiteRoleButtons";
import { database } from "../../../lib/data/database";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  const siteName = String(context.params?.siteName);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  // const sites = await database.site.findMany({
  //   where: { owner: { id: verifiedUser?.id } },
  //   select: { name: true, id: true },
  // });
  // const userWithEmails = await database.user.findUnique({
  //   where: { id: verifiedUser.id },
  //   include: {
  //     VerifiedEmail: { select: { email: true } },
  //     EmailValidation: { select: { email: true } },
  //   },
  // });
  const invite = await database.siteRoleInvitation.findFirst({
    where: {
      site: { name: siteName },
      OR: [{ recipientUserId: verifiedUser.id }, { toEmail: verifiedUser.email }],
    },
    select: { name: true, id: true, fromUser: { select: { email: true } } },
  });
  if (!invite) {
    return {
      redirect: { destination: "/account", permanent: false },
    };
  }
  return {
    props: {
      user: verifiedUser,
      siteName,
      invite: { roleType: invite?.name, fromEmail: invite?.fromUser.email },
    },
  };
};

export default function siteInvitePage({
  user,
  siteName,
  invite,
}: {
  invite: { fromEmail?: string; roleType: string };
  user: APIUser;
  siteName: string;
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      title={`Site Role Invite`}
      isDashboard
      content={
        <>
          <MainSection title={`Invite to ${siteName}`}>
            Click to join <b>{siteName}</b> as an {invite.roleType} : <SiteRoleAcceptButton siteName={siteName} />
          </MainSection>
        </>
      }
    />
  );
}
