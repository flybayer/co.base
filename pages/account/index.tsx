import { GetServerSideProps } from "next";
import { BasicSiteLayout } from "../../lib/components/SiteLayout";
import { destroyCookie } from "nookies";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../lib/server/getVerifedUser";
import { LinkButton } from "../../lib/components/Buttons";
import { Button, Spinner, Text } from "@chakra-ui/core";
import Link from "next/link";
import { database } from "../../lib/data/database";
import styled from "@emotion/styled";
import { api } from "../../lib/server/api";
import { ReactElement, useState } from "react";
import { CenterButtonRow, MainSection } from "../../lib/components/CommonViews";
import { ListContainer, ListItem } from "../../lib/components/List";
import { SiteRoleAcceptButton, SiteRoleRejectButton } from "../../lib/components/SiteRoleButtons";
import { SiteRole } from "../../lib/data/SiteRoles";
import { DevPreviewSubscribeButton } from "../../lib/components/Paddle";
import { BillingState } from "../api/billing-hook";

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
  const verifiedUser = await getVerifiedUser(context.req);
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
  const fullUser = await database.user.findUnique({
    where: { id: verifiedUser.id },
    include: {
      VerifiedEmail: { select: { email: true } },
      EmailValidation: { select: { email: true } },
    },
  });

  return {
    props: {
      sites: [
        ...sites.map((s) => ({ name: s.name, roleType: "owner" })),
        ...siteRoles.map((siteRole) => ({ name: siteRole.site.name, roleType: siteRole.name })),
      ],
      siteInvites,
      user: verifiedUser,
      billingState: fullUser?.billing,
      emails: [
        { primary: true, email: verifiedUser.email },
        ...(fullUser?.VerifiedEmail.filter((e) => e.email !== verifiedUser.email).map((verifiedEmail) => {
          return { email: verifiedEmail.email };
        }) || []),
        ...(fullUser?.EmailValidation.map((unverifiedEmail) => {
          return { email: unverifiedEmail.email, unverified: true };
        }) || []),
      ],
    },
  };
};

function UserName({ user }: { user: APIUser }) {
  return (
    <>
      <h2>Account: {user.username}</h2>
      <LinkButton href="/account/set-username">Set Username</LinkButton>
    </>
  );
}

function NameBox({ user }: { user: APIUser }) {
  return (
    <>
      <h3>Name</h3>
      <p>{user.name}</p>
      <LinkButton href="/account/set-name">Set Name</LinkButton>
    </>
  );
}

function PasswordBox({ user }: { user: APIUser }) {
  return (
    <>
      <h3>Password</h3>
      <div>{user.hasPassword ? "PW is set" : "No pw set"}</div>
      <Link href="/account/set-password">
        <Button>Set Password</Button>
      </Link>
    </>
  );
}
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

// This feature is UN-IMPLEMENTED because paddle does not allow the primary email to change. maybe this can be revisited later

// function MakePrimaryEmailButton({ email }: { email: string }) {
//   const [isSpin, setIsSpin] = useState(false);
//   const { reload } = useRouter();
//   return (
//     <Button
//       onClick={() => {
//         setIsSpin(true);
//         api("account-primary-email", { email })
//           .then(reload)
//           .catch(console.error)
//           .finally(() => {
//             setIsSpin(false);
//           });
//       }}
//     >
//       Set Primary Email {isSpin && <Spinner size="sm" />}
//     </Button>
//   );
// }

function DeleteEmailButton({ email }: { email: string }) {
  const [isSpin, setIsSpin] = useState(false);
  const { reload } = useRouter();
  return (
    <Button
      colorScheme="red"
      onClick={() => {
        setIsSpin(true);
        api("account-delete-email", { email })
          .then(reload)
          .catch(console.error)
          .finally(() => {
            setIsSpin(false);
          });
      }}
    >
      Delete {isSpin && <Spinner size="sm" />}
    </Button>
  );
}
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

export default function AccountPage({
  user,
  sites,
  emails,
  siteInvites,
  billingState,
}: {
  user: APIUser;
  sites: Array<{ name: string; roleType: SiteRole | "owner" }>;
  emails: Array<{ email: string; primary?: true; unverified?: true }>;
  siteInvites: Array<{ name: string; site: { name: string } }>;
  billingState: BillingState;
}): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      user={user}
      isDashboard
      content={
        <>
          <SiteInvitesSection siteInvites={siteInvites} />
          <MainSection title="Your Sites">
            {sites.map((site) => (
              <Link href={`/sites/${site.name}`} key={site.name}>
                <SiteContainer>
                  <SiteName>
                    {site.name} ({site.roleType})
                  </SiteName>
                </SiteContainer>
              </Link>
            ))}
            <CenterButtonRow>
              <Link href={`/account/new-site`}>
                <Button colorScheme="avenColor">New Site</Button>
              </Link>
            </CenterButtonRow>
          </MainSection>
          <MainSection title="Name">
            <UserName user={user} />
            <NameBox user={user} />
          </MainSection>
          <MainSection title="Auth">
            <PasswordBox user={user} />
          </MainSection>
          <MainSection title="Email">
            {emails.map(({ email, unverified, primary }) => (
              <div key={email}>
                {email} {unverified && "(unverified)"}
                {primary && "(primary)"}
                {/* {!unverified && !primary && <MakePrimaryEmailButton email={email} />} */}
                {!primary && <DeleteEmailButton email={email} />}
              </div>
            ))}
            <LinkButton href={`/account/add-email`}>Add Email</LinkButton>
          </MainSection>
          <MainSection title="Billing">
            <DevPreviewSubscribeButton user={user} />
            <Text>{JSON.stringify(billingState)}</Text>
          </MainSection>

          <MainSection title="Account">
            <CenterButtonRow>
              <Button
                onClick={() => {
                  destroyCookie(null, "AvenSession");
                  push("/login");
                }}
              >
                Log Out
              </Button>
              <LinkButton colorScheme="red" href={"/account/destroy"}>
                Delete Account
              </LinkButton>
            </CenterButtonRow>
          </MainSection>
        </>
      }
    />
  );
}
