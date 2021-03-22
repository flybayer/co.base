import { Text } from "@chakra-ui/layout"
import styled from "@emotion/styled"

const ErrorPageMain = styled.main``
const ErrorPageContainer = styled.div``

export function ErrorPage({ title, statusCode }: { title: string; statusCode: number }) {
  return (
    <ErrorPageContainer>
      <ErrorPageMain>
        <Text>
          {statusCode} ::: {title}
        </Text>
      </ErrorPageMain>
    </ErrorPageContainer>
  )
}
