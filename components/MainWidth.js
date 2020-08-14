import React from "react";
import styled from "@emotion/styled";

const Outer = styled.div({
  margin: "0 auto",
  maxWidth: 1280,
});

const Inner = styled.div({
  margin: "0",
});

export default function MainWidth({ children }) {
  return (
    <Outer>
      <Inner>{children}</Inner>
    </Outer>
  );
}
