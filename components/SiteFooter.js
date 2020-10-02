import { Link } from "@chakra-ui/core";
import styled from "@emotion/styled";
import React from "react";
import MainWidth from "./MainWidth";
const InnerWidth = styled.div`
  max-width: 950px;
  margin: 0 auto;
  padding: 25px;
`;
const FooterText = styled.p`
  color: white;
`;
export default function SiteFooter() {
  return (
    <>
      <div
        style={{
          borderTop: "1px solid #b1c8db",
          backgroundColor: "#d6e2ed",
          minHeight: 150,
          background: "url('/img/CloudFooter.webp')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "fill",
        }}
      >
        <MainWidth></MainWidth>
      </div>
      <div
        style={{
          borderTop: "1px solid #b1c8db",
          backgroundColor: "#222",
          minHeight: 100,
        }}
      >
        <InnerWidth>
          <FooterText>
            © Aven LLC and Aven Contributors. Licensed under{" "}
            <Link href="https://creativecommons.org/licenses/by-nc-sa/4.0/">
              Creative Commons BY-NC-SA 4.0
            </Link>
          </FooterText>
          <FooterText>
            <Link href="https://github.com/avencloud/sky">Source Open</Link>{" "}
            under{" "}
            <Link href="https://github.com/AvenCloud/sky/blob/main/LICENSE.md">
              Apache 2.0
            </Link>
          </FooterText>
        </InnerWidth>
      </div>
    </>
  );
}
