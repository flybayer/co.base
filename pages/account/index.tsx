import { GetServerSideProps } from "next";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import Link from "next/link";
import { database } from "../../lib/data/database";
import styled from "@emotion/styled";
import { ReactElement } from "react";
import { CenterButtonRow, MainSection } from "../../lib/components/CommonViews";
import { ListContainer, ListItem } from "../../lib/components/List";
import { SiteRoleAcceptButton, SiteRoleRejectButton } from "../../lib/components/SiteRoleButtons";
import { SiteRole } from "../../lib/data/SiteRoles";
import { AccountPage } from "../../lib/components/AccountPage";
import { LogOutButton } from "../../lib/components/LogOutButton";
import { CreateSiteButton } from "../../lib/components/CreateSiteButton";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  if (!verifiedUser) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const sites = await database.site.findMany({
    where: { owner: { id: verifiedUser.id } },
    select: { name: true, id: true },
  });
  const siteInvites = await database.siteRoleInvitation.findMany({
    where: { recipientUser: { id: verifiedUser.id } },
    select: { site: { select: { name: true } }, name: true },
  });
  const siteRoles = await database.siteRole.findMany({
    where: { user: { id: verifiedUser.id } },
    select: { site: { select: { name: true } }, name: true },
  });
  return {
    props: {
      sites: [
        ...sites.map((s) => ({ name: s.name, roleType: "owner" })),
        ...siteRoles.map((siteRole) => ({ name: siteRole.site.name, roleType: siteRole.name })),
      ],
      siteInvites,
      user: verifiedUser,
    },
  };
};

const SiteName = styled.h3`
  font-size: 32px;
`;
const SiteContainer = styled.div`
  border-radius: 4px;
  padding: 12px;
  margin: 10px;
  display: flex;
  background: #ececec;
  justify-content: space-between;
  border: 1px solid #ececec;
  :hover {
    background: white;
    border: 1px solid #eee;
    cursor: pointer;
  }
  h3 {
    cursor: pointer:
    font-size: 132px;
  }
`;

function SiteInvitesSection({
  siteInvites,
}: {
  siteInvites: Array<{ name: string; site: { name: string } }>;
}): ReactElement | null {
  if (!siteInvites.length) {
    return null;
  }
  return (
    <MainSection title="Site Invitations">
      <ListContainer>
        {siteInvites.map((invite) => (
          <ListItem key={invite.site.name}>
            {invite.site.name} <SiteRoleAcceptButton siteName={invite.site.name} />
            <SiteRoleRejectButton siteName={invite.site.name} />
          </ListItem>
        ))}
      </ListContainer>
    </MainSection>
  );
}

export default function AccountIndexPage({
  user,
  sites,
  siteInvites,
}: {
  user: APIUser;
  sites: Array<{ name: string; roleType: SiteRole | "owner" }>;
  siteInvites: Array<{ name: string; site: { name: string } }>;
}): ReactElement {
  return (
    <AccountPage tab="index" user={user}>
      <SiteInvitesSection siteInvites={siteInvites} />
      <MainSection title="Your Sites">
        {sites.map((site) => (
          <Link href={`/s/${site.name}`} key={site.name}>
            <SiteContainer>
              <SiteName>
                {site.name} ({site.roleType})
              </SiteName>
            </SiteContainer>
          </Link>
        ))}
        <CenterButtonRow>
          <CreateSiteButton />
        </CenterButtonRow>
      </MainSection>
      <MainSection title="Account">
        <CenterButtonRow>
          <LogOutButton />
        </CenterButtonRow>
      </MainSection>
    </AccountPage>
  );
}
