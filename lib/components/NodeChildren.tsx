import { Divider } from "@chakra-ui/core";
import { AddIcon } from "@chakra-ui/icons";
import { ButtonContainer, ListContainer, ListLinkItem } from "./List";
import { LinkButton } from "./Buttons";
import { ReactElement } from "react";

export default function NodeChildren({
  siteName,
  address,
  childs,
}: {
  siteName: string;
  address: string[];
  childs: Array<{
    key: string;
  }>;
}): ReactElement {
  return (
    <ListContainer>
      {childs.map((child) => (
        <ListLinkItem
          key={child.key}
          href={`/s/${siteName}/dashboard/${[...address, child.key].join("/")}`}
          label={child.key}
        />
      ))}
      <Divider />
      <ButtonContainer>
        <LinkButton href={`/s/${siteName}/create/${address.join("/")}`} leftIcon={<AddIcon />} colorScheme="avenColor">
          Add Item
        </LinkButton>
      </ButtonContainer>
    </ListContainer>
  );
}
