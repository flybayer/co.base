import React, { ReactElement } from "react";
import { SimpleGrid, Box, Heading, Text } from "@chakra-ui/core";
import { LinkButton } from "./Buttons";
import { APIUser } from "../api-utils/getVerifedUser";
import { DevPreviewSubscribeButton } from "./Paddle";

function FeatureBox({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div style={{ height: 80 }}>
      <Heading size="sm">{label}</Heading>
      <Text>{value}</Text>
    </div>
  );
}

function PricingCol({
  title,
  price,
  cta,
  content,
  team,
  sites,
}: {
  title: string;
  price?: string;
  cta: ReactElement;
  content?: ReactElement;
  team?: string;
  sites?: string;
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
      {content}
      {team && <FeatureBox label="Team Members" value={team} />}
      {sites && <FeatureBox label="Sites" value={sites} />}
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
      <PricingCol
        title="Developer Preview"
        price="$12/mo"
        sites="2"
        team="5"
        cta={<DevPreviewSubscribeButton user={user} />}
        content={
          <>
            <ul>
              <li>Aven Cloud Hosting</li>
              <li>Premium Support</li>
            </ul>
          </>
        }
      />
      <PricingCol
        title="Enterprise"
        sites="∞"
        team="∞"
        cta={<LinkButton href="mailto:enterprise@aven.io">Contact Us</LinkButton>}
        content={
          <>
            <ul>
              <li>Priority Support</li>
              <li>Private Infrastructure</li>
            </ul>
          </>
        }
      />
    </SimpleGrid>
  );
}
