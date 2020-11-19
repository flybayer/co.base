import { Button, Link } from "@chakra-ui/core";
import styled from "@emotion/styled";
import React from "react";
import MainWidth from "./MainWidth";
const InnerWidth = styled.div`
  max-width: 950px;
  margin: 0 auto;
  padding: 25px;
`;
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
            © Aven LLC.{" "}
            <FooterA href="https://github.com/avencloud/sky">
              Open Source
            </FooterA>{" "}
            under{" "}
            <FooterA href="https://github.com/AvenCloud/sky/blob/main/LICENSE.md">
              Apache 2.0
            </FooterA>
          </FooterText>
        </InnerWidth>
      </div>
    </>
  );
}
