import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useDisclosure,
} from "@chakra-ui/core";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { api } from "../../../api-utils/api";
import getVerifiedUser, { APIUser } from "../../../api-utils/getVerifedUser";
import ControlledInput from "../../../components/ControlledInput";
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
function InviteRoleForm({ siteName }: { siteName: string }) {
  const { reload } = useRouter();
  const { handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      email_username: "",
    },
  });
  return (
    <form
      onSubmit={handleSubmit((data) => {
        api("site-role-invite", {
          emailUsername: data.email_username,
          siteName,
        })
          .then(() => {
            reload();
          })
          .catch((e) => {
            console.error(e);
          });
      })}
    >
      <ModalBody></ModalBody>
      <FormControl>
        <FormLabel htmlFor="email-input">
          Recipient Email or Aven Username
        </FormLabel>
        <ControlledInput
          name="email_username"
          id="email-input"
          aria-describedby="email-username-helper-text"
          control={control}
        />
        <FormHelperText id="email-username-helper-text">
          An invitation will be sent to the recipient via email.
        </FormHelperText>
      </FormControl>
      <ModalFooter>
        <Button type="submit">Invite</Button>
      </ModalFooter>
    </form>
  );
}

function NewRoleButton({ siteName }: { siteName: string }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button onClick={onOpen}>Add Role</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add User</ModalHeader>
          <ModalCloseButton />
          <InviteRoleForm siteName={siteName} />
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
                {role !== "owner" && (
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
                )}
              </div>
            ))}
          </ListContainer>
          <NewRoleButton siteName={siteName} />
        </>
      }
    />
  );
}
