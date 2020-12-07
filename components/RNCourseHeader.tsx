import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/core";
import styled from "@emotion/styled";
import Link from "next/link";

const Container = styled.div`
  max-width: 950px;
  margin: 30px auto;
  @media only screen and (max-width: 1030px) {
    padding-left: 40px;
    padding-right: 40px;
  }
  a {
    font-size: 1.7em;
    display: inline;
    color: #374453;
    font-weight: bold;
  }
  h1 {
    font-size: 1.7em;
    display: inline;
    color: #374453;
    font-weight: normal;
  }
`;

export default function RNCourseHeader({ title, number }: { title: string; number?: string }) {
  return (
    <Container>
      <Link href="/react-native">Intro to React Native » </Link>
      <h1>
        {number && `Chapter ${number}: `}
        {title}
      </h1>
    </Container>
  );
}
