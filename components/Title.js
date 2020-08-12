import React from "react";
import styled from "@emotion/styled";

const H1 = styled.h1({
  color: "#222",
});

export default function Title({ children }) {
  return <H1>{children}</H1>;
}
