import styled from "@emotion/styled";
import Link from "next/link";
import React from "react";
import { InnerWidth } from "./CommonViews";

const FooterText = styled.p`
  color: #bbb;
`;
const FooterA = styled.a`
  color: #bbb;
  text-decoration: underline;
  transition: color 0.25s ease-out, border 0.25s ease-out;
  :hover {
    color: white;
  }
`;
function FooterLink({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href} passHref>
      <FooterA>{children}</FooterA>
    </Link>
  );
}
export default function SiteFooter() {
  return (
    <>
      <div
        style={{
          borderTop: "1px solid #b1c8db",
          backgroundColor: "#222",
          minHeight: 100,
        }}
      >
        <InnerWidth>
          <FooterText>
            © {new Date().getFullYear()} Aven.{" "}
            {/* <FooterA href="https://github.com/avencloud/sky">
              Open Source
            </FooterA>{" "}
            under{" "}
            <FooterA href="https://github.com/AvenCloud/sky/blob/main/LICENSE.md">
              Apache 2.0
            </FooterA> */}
          </FooterText>
          <FooterLink href="/docs">Documentation</FooterLink>
        </InnerWidth>
      </div>
    </>
  );
}
