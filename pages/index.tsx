// ---
// title: "Aven"
// publishedAt: 2020-09-01
// summary: "Aven: an open experiment to help you build apps"
// ---

import { Button } from "@chakra-ui/core";
import styled from "@emotion/styled";
import Head from "next/head";
import Link from "next/link";

// ### [Intro to React Native](/react-native)

// A free introductory course on building apps with React Native.

// ### Open Source

// [This website](/sky-site) is an open source testing ground for application deployment. Eric has been at the genesis of several influential open source technogies, and there is more to come.

// ### Consulting

// [Eric](/eric-vicenti) is available to consult on your mobile or web development. Recent clients include the food industry, robotics, and medical devices.

// Please get in touch with [eric@aven.io](mailto:eric@aven.io).

// <!--- © Aven LLC and Aven Contributors. Licensed under Creative Commons CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/ -->

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
