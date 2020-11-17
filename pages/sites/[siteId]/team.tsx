import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  useDisclosure,
} from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import { ListContainer } from "../../../components/List";
import { BasicSiteLayout } from "../../../components/SiteLayout";
import { SiteTabs } from "../../../components/SiteTabs";
import { database } from "../../../data/database";

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
  const site = await database.site.findOne({
    where: { name: siteName },
    include: {
      owner: { select: { name: true, id: true, username: true, email: true } },
      SiteRole: {
        include: {
          user: {
            select: { name: true, id: true, username: true, email: true },
          },
        },
      },
    },
  });
  const owner = site?.owner;
  const siteRoles =
    site?.SiteRole.map((siteRole) => ({
      role: siteRole.name,
      user: siteRole.user,
    })) || [];
  owner && siteRoles.unshift({ user: owner, role: "owner" });

  return {
    props: {
      user: verifiedUser,
      siteName,
      siteRoles,
    },
  };
};

function NewRoleButton() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button onClick={onOpen}>Add Role</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <h2>username or email address plz</h2>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function SiteTeamPage({
  user,
  siteRoles,
  siteName,
}: {
  user: APIUser;
  siteName: string;
  siteRoles: Array<{
    role: string;
    user: { username: string; name: string | null; id: number; email: string };
  }>;
}) {
  const { push } = useRouter();
  return (
    <BasicSiteLayout
      content={
        <>
          <SiteTabs tab="team" siteName={siteName} />
          <ListContainer>
            {siteRoles.map(({ user, role }) => (
              <div>
                {user.name || user.email} ({role})
                <Select
                  value="admin"
                  onChange={(e) => {
                    const role = e.target.value;
                  }}
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Administrator</option>
                  <option value="billing">Billing</option>
                  <option value="writer">Writer</option>
                  <option value="reader">Reader</option>
                </Select>
              </div>
            ))}
          </ListContainer>
          <NewRoleButton />
        </>
      }
    />
  );
}
