import styled from "@emotion/styled";
import Link from "next/link";
import { ReactElement } from "react";
import { Icon } from "./Icon";
import { IconName } from "@fortawesome/fontawesome-svg-core";

export const TabBarContainer = styled.div`
  display: flex;
  align-items: flex-end;
  align-self: stretch;
`;

export const TitleContainer = styled.div`
  h2 {
    font-size: 42px;
    margin: 0;
    margin-top: -20px;
  }
  flex-grow: 1;
  border-bottom: 2px solid rgb(226, 232, 240);
`;

export const HeaderA = styled.a`
  font-size: 32px;
  color: #222;
  :hover {
    color: #666;
  }
  line-height: 52px;
`;

export function HeaderLink({ href, label, icon }: { href: string; label: string; icon?: IconName }): ReactElement {
  return (
    <Link href={href} passHref>
      <HeaderA>
        {label}
        {icon && (
          <div style={{ marginLeft: 12, position: "relative", top: 3, display: "inline-block" }}>
            <Icon icon={icon} size="1x" />
          </div>
        )}
      </HeaderA>
    </Link>
  );
}
