import React, { ReactElement } from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { InnerWidth } from "./CommonViews";
import AvenLogo from "./AvenLogo";
import { Button } from "@chakra-ui/core";
import { APIUser } from "../server/getVerifedUser";
import { parse } from "cookie";
import { decode } from "jwt-simple";

const HeaderContainer = styled.div`
  background: #0e2b49;
`;
const HeaderLinks = styled.div`
  margin-left: 12px;
`;
const HeaderLinkA = styled.a`
  color: white;
  margin: 12px;
  font-size: 18px;
`;

function useCurrentUser(loadedUser?: null | APIUser): null | { username: string } {
  if (loadedUser) {
    return { username: loadedUser.username };
  }
  if (global.document) {
    const cookies = parse(global.document.cookie);
    const session = cookies.AvenSession;
    if (!session) return null;
    const jwtSession = decode(session, "unknown", true);
    return { username: jwtSession.username };
  }
  return null;
}

function HeaderLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} passHref>
      <HeaderLinkA>{children}</HeaderLinkA>
    </Link>
  );
}
export default function SiteHeader({
  user,
  isDashboard,
}: {
  user?: APIUser | null;
  isDashboard?: boolean;
}): ReactElement {
  const currentUser = useCurrentUser(user);
  return (
    <HeaderContainer>
      <InnerWidth>
        <span
          style={{
            display: "flex",
            alignSelf: "stretch",
            alignItems: "center",
          }}
        >
          <Link href="/preview">
            <div style={{ cursor: "pointer" }}>
              <AvenLogo />
            </div>
          </Link>
          {!isDashboard && (
            <>
              <HeaderLinks>
                <HeaderLink href="/pricing">Pricing</HeaderLink>
                <HeaderLink href="/docs">Docs</HeaderLink>
                <HeaderLink href="/docs/open-source">Open Source</HeaderLink>
              </HeaderLinks>
            </>
          )}
        </span>
        <span
          style={{
            display: "flex",
            alignSelf: "stretch",
            alignItems: "center",
          }}
        >
          {currentUser ? (
            <>
              <HeaderLink href="/account">@{currentUser.username}</HeaderLink>
            </>
          ) : (
            <>
              <HeaderLink href="/login">Register / Log In</HeaderLink>
              <Link href="/docs/getting-started" passHref>
                <Button as={"a"} colorScheme="avenColor">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </span>
      </InnerWidth>
    </HeaderContainer>
  );
}
