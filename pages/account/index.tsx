import { GetServerSideProps, GetServerSidePropsContext } from "next";
import SiteLayout from "../../components/SiteLayout";
import redirect from "../../api-utils/redirect";
import { destroyCookie } from "nookies";
import Router from "next/router";
import getVerifiedUser, { APIUser } from "../../api-utils/getVerifedUser";
import PostButton, { LinkButton } from "../../components/PostButton";
import { Button } from "@chakra-ui/core";
import Link from "next/link";
import { database } from "../../data/database";
import styled from "@emotion/styled";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
  if (!verifiedUser) {
    redirect(context.res, "/login");
  }
  const sites = await database.site.findMany({
    where: { owner: { id: verifiedUser?.id } },
    select: { name: true, id: true },
  });
  return {
    props: {
      sites,
      user: verifiedUser,
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

const SiteContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;

  h3 {
    font-size: 32px;
  }
`;

export default function accountPage({
  user,
  sites,
}: {
  user: APIUser;
  sites: Array<{ id: number; name: string }>;
}) {
  return (
    <SiteLayout
      content={
        <>
          <UserName user={user} />
          <NameBox user={user} />
          <PasswordBox user={user} />
          <h3>Email</h3>
          <div>{user.email}</div>
          <h3>Billing</h3>
          <PostButton action="/api/billing-session" primary>
            Manage billing
          </PostButton>
          {sites.map((site) => (
            <Link href={`/account/sites/${site.name}`}>
              <SiteContainer>
                <h3>{site.name}</h3>
                <Link href={`/account/sites/${site.name}`}>
                  <Button colorScheme="green">Dashboard</Button>
                </Link>
                <Link href={`/account/sites/${site.name}`}>
                  <Button>Settings</Button>
                </Link>
              </SiteContainer>
            </Link>
          ))}
          <Link href={`/account/new-site`}>
            <Button colorScheme="green">New Site</Button>
          </Link>
          <h3>Account</h3>
          <Button
            onClick={() => {
              destroyCookie(null, "AvenSession");
              Router.push("/login");
            }}
          >
            Log Out
          </Button>
        </>
      }
    />
  );
}
