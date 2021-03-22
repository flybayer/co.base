import * as ChakraUI from "@chakra-ui/layout"
import { css, PropsOf } from "@emotion/react"
import styled from "@emotion/styled"

export const Title = styled.h1`
  color: #222;
  font-size: 42px;
  font-family: FiraSans;
  margin: 0 0 20px 0;
`

export const Text = (props: PropsOf<typeof ChakraUI.Text>) => {
  return (
    <ChakraUI.Text
      {...props}
      css={css`
        margin: 0 0 20px 0;
      `}
    />
  )
}

export const UnorderedList = (props: PropsOf<typeof ChakraUI.UnorderedList>) => {
  return (
    <ChakraUI.UnorderedList
      {...props}
      css={css`
        margin: 0 0 20px 0;

        li {
          margin: 0 0 12px 0;
        }
      `}
    />
  )
}
