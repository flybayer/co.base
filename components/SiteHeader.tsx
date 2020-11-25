import React from "react";
import styled from "@emotion/styled";
import Link from "next/link";
import { InnerWidth } from "./CommonViews";
import AvenLogo from "./AvenLogo";
import { Button } from "@chakra-ui/core";

const HeaderContainer = styled.div`
  background: #0e2b49;
`;

const HeaderLinkA = styled.a`
  color: white;
`;

function HeaderLink({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} passHref>
      <HeaderLinkA>{children}</HeaderLinkA>
    </Link>
  );
}
export default function SiteHeader() {
  return (
    <HeaderContainer>
      <InnerWidth>
        <span>
          <Link href="/">
            <div style={{ cursor: "pointer" }}>
              <AvenLogo />
            </div>
          </Link>
          <HeaderLink href="/docs">Docs</HeaderLink>
          <HeaderLink href="/pricing">Pricing</HeaderLink>
        </span>
        <span>
          <HeaderLink href="/login">Log In</HeaderLink>
          <Button colorScheme="blue">Create a Site</Button>
        </span>
      </InnerWidth>
    </HeaderContainer>
  );
}
