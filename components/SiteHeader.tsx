import React, { ReactElement } from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { InnerWidth } from "./CommonViews";
import AvenLogo from "./AvenLogo";
import { Button } from "@chakra-ui/core";
import { APIUser } from "../api-utils/getVerifedUser";

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

function HeaderLink({ href, children }: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} passHref>
      <HeaderLinkA>{children}</HeaderLinkA>
    </Link>
  );
}
export default function SiteHeader({ user }: { user?: APIUser }): ReactElement {
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
          <HeaderLinks>
            <HeaderLink href="/pricing">Pricing</HeaderLink>
            <HeaderLink href="/docs">Docs</HeaderLink>
            <HeaderLink href="/docs/open-source">Open Source</HeaderLink>
          </HeaderLinks>
        </span>
        <span
          style={{
            display: "flex",
            alignSelf: "stretch",
            alignItems: "center",
          }}
        >
          {user ? (
            <>
              <HeaderLink href="/account">@{user.username}</HeaderLink>
            </>
          ) : (
            <>
              <HeaderLink href="/login">Log In</HeaderLink>
              <Button colorScheme="avenColor">Create a Data Site</Button>
            </>
          )}
        </span>
      </InnerWidth>
    </HeaderContainer>
  );
}
