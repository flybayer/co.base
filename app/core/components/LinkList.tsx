import { Text } from "@chakra-ui/layout"
import styled from "@emotion/styled"
import Link from "next/link"

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
`
const LinkContainer = styled.a`
  padding: 10px 20px;
  border-top: 1px solid #ccc;
  margin-top: -1px;
`

export function LinkList<ItemType>({
  items,
  getKey,
  getLabel,
  getHref,
}: {
  items: Array<ItemType>
  getKey: (item: ItemType) => string
  getLabel: (item: ItemType) => string
  getHref: (item: ItemType) => string
}) {
  if (!items.length) return <Text>Empty!</Text>
  return (
    <ListContainer>
      {items.map((item) => (
        <Link href={getHref(item)} passHref={true} key={getKey(item)}>
          <LinkContainer>{getLabel(item)}</LinkContainer>
        </Link>
      ))}
    </ListContainer>
  )
}
