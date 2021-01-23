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
import { LinkButton } from "../../lib/components/Buttons";
import { LogOutButton } from "../../lib/components/LogOutButton";

// req.headers =
// "host":"aven.io",
// "accept-encoding":"gzip",
// "x-forwarded-for":"2603:8001:6b00:3b0:e022:8da9:4cc7:f9c2,172.69.33.52",
// "x-forwarded-proto":"https",
// "cache-control":"max-age=0",
// "upgrade-insecure-requests":"1",
// "user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
// ,"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
// "sec-fetch-site":"same-origin",
// "sec-fetch-mode":"navigate",
// "sec-fetch-user":"?1",
// "sec-fetch-dest":"document",
// "accept-language":"en-US,en;q=0.9"
// "cookie":"__cfduid=d94ea1341160d8133ab6a64b15fc7a08b1609268034; AvenSession=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOjEsImV4cCI6MTYwOTM1NDQ1MywiaWF0IjoxNjA5MjY4MDUzLCJyZXZhbGlkYXRlVG9rZW4iOiI5Nngzam9tbXdra2VkNm8yMGx0MW1rMHR5Y25vdDI5aXY5NGQ1N2w2eXE1MzNzbSIsInJldmFsaWRhdGVJUCI6ImZpeG1lLWRldmljZS1vcmlnaW5pcCJ9.XWbot4ki01qJYcy4w7Gp6PEZgOcTyA4Wj0S-L8Dyu-c",
// "cdn-loop":"cloudflare",
// "x-request-id":"491af320-ae1c-431b-9c79-0420d5208ec6",
// "do-connecting-ip":"2603:8001:6b00:3b0:e022:8da9:4cc7:f9c2",
// "x-b3-traceid":"eb6ba6443cef626680ca48e82c749dc4",
// "x-b3-spanid":"80ca48e82c749dc4",
// "x-b3-sampled":"0",
// "content-length":"0",

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
          <LinkButton href="/account/new-site" colorScheme="avenColor">
            Create Data Site
          </LinkButton>
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
