import { Button, Text } from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { api } from "../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { APIButton } from "../../../components/APIButton";
import { CenterButtonRow, MainSection } from "../../../components/CommonViews";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteTabs } from "../../../components/SiteTabs";
import { database } from "../../../data/database";
import { handleAsync } from "../../../data/handleAsync";
import { SiteSchema } from "../../../data/SiteSchema";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const verifiedUser = await getVerifiedUser(context.req);
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
  return {
    props: {
      user: verifiedUser,
      siteName,
      schema: site?.schema,
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

export default function SiteTeamPage({
  user,
  siteName,
  schema,
}: {
  user: APIUser;
  siteName: string;
  schema?: SiteSchema;
}): ReactElement {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      user={user}
      content={
        <>
          <SiteTabs tab="settings" siteName={siteName} />
          <SiteAccessSection schema={schema} siteName={siteName} />
          <MainSection title="Site Ownership">
            <CenterButtonRow>
              <Button disabled>Transfer to Another User</Button>
            </CenterButtonRow>
          </MainSection>
          <MainSection title="Danger">
            <CenterButtonRow>
              <APIButton
                colorScheme="red"
                endpoint="site-destroy"
                payload={{ name: siteName }}
                onDone={() => {
                  push("/account");
                }}
              >
                Delete Site
              </APIButton>
            </CenterButtonRow>
          </MainSection>
        </>
      }
    />
  );
}
