import styled from "@emotion/styled";
import Head from "next/head";
import Link from "next/link";

const ScreenContainer = styled.div`
  height: 100%;
  background: url("/img/FullCloud.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center bottom;
  display: flex;
  justify-content: center;
`;

const ContentContainer = styled.main`
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  flex-grow: 1;
  box-shadow: 0px 0px 5px #888888;
  justify-content: center;
`;

const LinkImage = styled.img`
  position: relative;
  left: -8px;
  width: 200px;
  margin: 20px 10px;
  cursor: pointer;
`;

const Title = styled.h1`
  font-size: 28px;
  text-align: center;
  margin: 32px 12px;
`;

export default function HomePage() {
  return (
    <ScreenContainer>
      <ContentContainer>
        <Head>
          <title>Aven Cloud</title>
        </Head>
        <Link href="/">
          <LinkImage src="/img/AvenCloudLogo.svg" alt="Aven" />
        </Link>
        <Title>invite only.</Title>
      </ContentContainer>
    </ScreenContainer>
  );
}
