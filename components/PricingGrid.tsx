import React, { ReactElement } from "react";
import { SimpleGrid, Box, Heading, Text, Divider } from "@chakra-ui/core";
import { LinkButton } from "./Buttons";
import { APIUser } from "../api-utils/getVerifedUser";
import { DevPreviewSubscribeButton } from "./Paddle";
import styled from "@emotion/styled";

const FeatureBoxContainer = styled.div`
  height: 80px;
  display: flex;
  flex-direction: column;
  margin: 0 30px;
`;
const FeatureHeading = styled.span`
  font-weight: bold;
  font-size: 20px;
`;
const FeatureValue = styled.span`
  font-size: 26px;
  text-align: center;
`;

function FeatureBox({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <FeatureBoxContainer>
      <FeatureHeading>{label}</FeatureHeading>
      <FeatureValue>{value}</FeatureValue>
    </FeatureBoxContainer>
  );
}

const PrimaryCol = styled.div`
  // border: 1px solid blue;
  border-radius: 16px;
  padding: 16px;
  margin-top: -32px;
  box-shadow: 0px 0px 6px #888888;
  background: #f0f6ff;
`;
const GridContent = styled.div`
  ul {
    margin-left: 30px;
  }
  height: 120px;
`;
function PricingCol({
  title,
  price,
  cta,
  content,
  team,
  sites,
  readRequests,
  writeRequests,
}: {
  title: string;
  price?: string;
  cta: ReactElement;
  content?: ReactElement;
  team?: string;
  sites?: string;
  readRequests?: string;
  writeRequests?: string;
}) {
  return (
    <Box>
      <div style={{ height: 70 }}>
        <Heading>{title}</Heading>
      </div>
      <div style={{ height: 40 }}>
        <Text>{price}</Text>
      </div>
      <div style={{ height: 60 }}>{cta}</div>
      <Divider />
      <GridContent>{content}</GridContent>
      <Divider />

      {sites && <FeatureBox label="Data Sites" value={sites} />}
      {team && <FeatureBox label="Team Members" value={team} />}
      <Divider />
      {readRequests && <FeatureBox label="Read Requests" value={readRequests} />}
      {writeRequests && <FeatureBox label="Write Requests" value={writeRequests} />}
    </Box>
  );
}

export default function PricingGrid({ user }: { user: APIUser }): ReactElement {
  return (
    <SimpleGrid columns={[1, null, 3]} spacing="40px">
      <PricingCol
        title="Open Source"
        price="Free, forever."
        cta={<LinkButton href="/docs/open-source-install">Get Started</LinkButton>}
        content={
          <>
            <ul>
              <li>Self-Hosted</li>
              <li>Community Support</li>
            </ul>
          </>
        }
      />
      <PrimaryCol>
        <PricingCol
          title="Developer Preview"
          price="$12/mo"
          sites="3"
          team="5"
          readRequests="10,000 / day"
          writeRequests="1,000 / day"
          cta={<DevPreviewSubscribeButton user={user} />}
          content={
            <>
              <ul>
                <li>Aven Cloud Hosting</li>
                <li>Email Support</li>
              </ul>
            </>
          }
        />
      </PrimaryCol>
      <PricingCol
        title="Enterprise"
        cta={<LinkButton href="mailto:enterprise@aven.io">Contact Us</LinkButton>}
        content={
          <>
            <ul>
              <li>Private Infrastructure</li>
              <li>No Resource Limits</li>
              <li>Priority Support</li>
            </ul>
          </>
        }
      />
    </SimpleGrid>
  );
}
