import React from "react";
import MainWidth from "./MainWidth";
import styled from "@emotion/styled";
import Link from "next/link";

const ImageFill = styled.div({
  background: "url('/img/CloudHeader.jpg')",
  backgroundRepeat: "no-repeat",
  backgroundSize: "fill",
  minHeight: 108,
});

const LinkImage = styled.img`
  position: relative;
  left: -8px;
  max-width: 210px;
  margin: 20px 10px;
  cursor: pointer;
`;

export default function SiteHeader() {
  return (
    <ImageFill>
      <MainWidth>
        <Link href="/preview">
          <LinkImage src="/img/AvenPrimary.png" alt="Aven" />
        </Link>
      </MainWidth>
    </ImageFill>
  );
}
