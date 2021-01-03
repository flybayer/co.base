import { GetServerSideProps } from "next";
import { ReactElement, useState } from "react";
import getVerifiedUser, { APIUser } from "../../../../lib/server/getVerifedUser";
import { database } from "../../../../lib/data/database";
import { Button, Text } from "@chakra-ui/core";
import { api } from "../../../../lib/server/api";
import { handleAsync } from "../../../../lib/data/handleAsync";
import { SiteSettingsPage } from "../../../../lib/components/SiteSettingsPage";
import { CenterButtonRow, MainSection } from "../../../../lib/components/CommonViews";
import { SiteSchema } from "../../../../lib/data/SiteSchema";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req, context.res);
  const siteName = String(context.params?.siteId);
  if (!verifiedUser) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
  const site = await database.site.findUnique({ where: { name: siteName }, select: { schema: true } });
  if (!site) return { redirect: { destination: "/account", permanent: false } };
  return {
    props: {
      user: verifiedUser,
      siteName,
      schema: site?.schema || null,
    },
  };
};

function SiteAccessSection({ schema, siteName }: { schema?: SiteSchema; siteName: string }) {
  const [isPublic, setIsPublic] = useState(schema?.isPublicReadable || false);
  let content = (
    <>
      <Text>Site is private. Reading and Writing may only be done by authorized Team members or API Tokens.</Text>
      <CenterButtonRow>
        <Button
          onClick={() => {
            handleAsync(api("site-schema-edit", { siteName, schema: { ...schema, isPublicReadable: true } }), () => {
              setIsPublic(true);
            });
          }}
        >
          Take Site Public
        </Button>
      </CenterButtonRow>
    </>
  );
  if (isPublic) {
    content = (
      <>
        <Text>Site is publicly Readable! Writes may only be done by authorized Team members or API Tokens.</Text>
        <CenterButtonRow>
          <Button
            onClick={() => {
              handleAsync(api("site-schema-edit", { siteName, schema: { ...schema, isPublicReadable: false } }), () => {
                setIsPublic(false);
              });
            }}
          >
            Take Site Private
          </Button>
        </CenterButtonRow>
      </>
    );
  }
  return <MainSection title="Site Access">{content}</MainSection>;
}

export default function SiteAccessPage({
  user,
  siteName,
  schema,
}: {
  user: APIUser;
  siteName: string;
  schema?: SiteSchema;
}): ReactElement {
  return (
    <SiteSettingsPage user={user} siteName={siteName} tab="access">
      <SiteAccessSection schema={schema} siteName={siteName} />
    </SiteSettingsPage>
  );
}
