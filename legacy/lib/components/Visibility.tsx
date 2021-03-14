import { PropsWithChildren, ReactElement } from "react";
import styled from "@emotion/styled";

const VisContainer = styled.div(
  (props) => `
  opacity: ${props["aria-hidden"] ? "1" : "0"};
  transition: 0.5s all;
`,
);

export function Visibility({ visible, children }: PropsWithChildren<{ visible: boolean }>): ReactElement {
  return <VisContainer aria-hidden={visible}>{children}</VisContainer>;
}
