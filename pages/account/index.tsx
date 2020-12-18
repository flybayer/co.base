import { GetServerSideProps, GetServerSidePropsContext } from "next";
import SiteLayout, { BasicSiteLayout } from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router, { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import PostButton, { LinkButton } from "../../components/Buttons";
import { Button, Spinner } from "@chakra-ui/core";
import Link from "next/link";
import { database } from "../../data/database";
import styled from "@emotion/styled";
import { api } from "../../api-utils/api";
import { ReactElement, useState } from "react";
import { CenterButtonRow, MainSection } from "../../components/CommonViews";
import { ListContainer, ListItem } from "../../components/List";
import { SiteRoleAcceptButton, SiteRoleRejectButton } from "../../components/SiteRoleButtons";
import { SiteRole } from "../../data/SiteRoles";
import Head from "next/head";
import { DevPreviewSubscribeButton, PaddleSetup } from "../../components/Paddle";

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
  const userWithEmails = await database.user.findUnique({
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
      emails: [
        { primary: true, email: verifiedUser.email },
        ...(userWithEmails?.VerifiedEmail.filter((e) => e.email !== verifiedUser.email).map((verifiedEmail) => {
          return { email: verifiedEmail.email };
        }) || []),
        ...(userWithEmails?.EmailValidation.map((unverifiedEmail) => {
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

function MakePrimaryEmailButton({ email }: { email: string }) {
  const [isSpin, setIsSpin] = useState(false);
  const { reload } = useRouter();
  return (
    <Button
      onClick={() => {
        setIsSpin(true);
        api("account-primary-email", { email })
          .then(reload)
          .catch(console.error)
          .finally(() => {
            setIsSpin(false);
          });
      }}
    >
      Set Primary Email {isSpin && <Spinner size="sm" />}
    </Button>
  );
}

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
}: {
  user: APIUser;
  sites: Array<{ name: string; roleType: SiteRole | "owner" }>;
  emails: Array<{ email: string; primary?: true; unverified?: true }>;
  siteInvites: Array<{ name: string; site: { name: string } }>;
}): ReactElement {
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <PaddleSetup />
          <SiteInvitesSection siteInvites={siteInvites} />
          <MainSection title="Your Sites">
            {sites.map((site) => (
              <Link href={`/sites/${site.name}`} key={site.name}>
                <SiteContainer>
                  <SiteName>
                    {site.name} ({site.roleType})
                  </SiteName>
                  <span>
                    <LinkButton href={`/sites/${site.name}/dashboard`} colorScheme="avenColor">
                      Dashboard
                    </LinkButton>
                    <LinkButton href={`/sites/${site.name}`}>Settings</LinkButton>
                  </span>
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
                {!unverified && !primary && <MakePrimaryEmailButton email={email} />}
                {!primary && <DeleteEmailButton email={email} />}
              </div>
            ))}
            <LinkButton href={`/account/add-email`}>Add Email</LinkButton>
          </MainSection>
          <MainSection title="Billing">
            <DevPreviewSubscribeButton user={user} />
          </MainSection>

          <MainSection title="Account">
            <CenterButtonRow>
              <Button
                onClick={() => {
                  destroyCookie(null, "AvenSession");
                  Router.push("/login");
                  debugger;
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
