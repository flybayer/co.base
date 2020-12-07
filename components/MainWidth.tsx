import React from "react";
import styled from "@emotion/styled";

const Outer = styled.div({
  margin: "0 auto",
  maxWidth: 1280,
});

export default function MainWidth({ children, hMargin }: React.PropsWithChildren<{ hMargin?: number }>) {
  const Inner = styled.div({
    margin: `0 ${hMargin}px`,
  });

  return (
    <Outer>
      <Inner>{children}</Inner>
    </Outer>
  );
}
