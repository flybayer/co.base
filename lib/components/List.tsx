import styled from "@emotion/styled";
import Link from "next/link";
import { ReactElement } from "react";

export const ListContainer = styled.div`
  background-color: white;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  padding: 8px;
`;
export const ButtonContainer = styled.div`
  padding: 8px;
  display: flex;
`;
export const ListLink = styled.a`
  border-radius: 4px;
  border-bottom: none;
  padding: 10px;
  margin-bottom: 6px;
  :hover {
    background-color: #eee;
  }
`;
export const ListItem = styled.div`
  border-radius: 4px;
  border-bottom: none;
  padding: 10px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
`;

export function ListLinkItem({ label, href }: { label: string; href: string }): ReactElement {
  return (
    <Link href={href} passHref>
      <ListLink>{label}</ListLink>
    </Link>
  );
}
