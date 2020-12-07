import React from "react";
import styled from "@emotion/styled";

const H1 = styled.h1({
  color: "#222",
});

export default function Title({ children }: React.PropsWithChildren<{ [a: string]: never }>) {
  return <H1>{children}</H1>;
}
