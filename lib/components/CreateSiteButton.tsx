import { Button, FormControl, FormLabel, useDisclosure } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { ReactElement } from "react";
import { api } from "../server/api";
import ControlledInput from "./ControlledInput";
import { useFullForm } from "./Form";
import { GenericModal, ModalForm } from "./Modal";

function ModalCreateSiteForm({ onComplete }: { onComplete: (response: void, data: { name: string }) => void }) {
  const { isSubmitting, errors, control, error, submitHandler } = useFullForm({
    defaultValues: { name: "" },
    onSubmit: (data) =>
      api("site-create", {
        name: data.name,
      }),
    onComplete,
  });
  return (
    <ModalForm isSubmitting={isSubmitting} submitHandler={submitHandler} submitLabel="Create Site" error={error}>
      <FormControl isRequired>
        <FormLabel htmlFor="name-input">Site Name</FormLabel>
        <ControlledInput name="name" placeholder="rocketship" id="name-input" control={control} />
        {errors.name && <p>{errors.name.message}</p>}
      </FormControl>
    </ModalForm>
  );
}

function CreateSiteModal({ isOpen, onComplete }: { isOpen: boolean; onComplete: (name?: string) => void }) {
  return (
    <GenericModal isOpen={isOpen} onClose={onComplete} title="Create Site">
      <ModalCreateSiteForm
        onComplete={(_, { name }) => {
          onComplete(name);
        }}
      />
    </GenericModal>
  );
}

export function CreateSiteButton(): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { push } = useRouter();
  return (
    <>
      <Button onClick={onOpen} variant="outline" colorScheme="avenColor">
        Create Data Site
      </Button>
      <CreateSiteModal
        isOpen={isOpen}
        onComplete={(siteName) => {
          push(`/s/${siteName}`);
          onClose();
        }}
      />
    </>
  );
}
