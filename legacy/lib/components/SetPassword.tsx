import { ReactElement } from "react";
import { Button, FormControl, FormLabel, useDisclosure } from "@chakra-ui/core";
import ControlledInput from "../../lib/components/ControlledInput";
import { api } from "../../lib/server/api";
import { GenericModal, ModalForm } from "../../lib/components/Modal";
import { useFullForm } from "../../lib/components/Form";
import { useRouter } from "next/router";

function ModalChangePasswordForm({ onComplete }: { onComplete: (response: void, data: { password: string }) => void }) {
  const { isSubmitting, errors, control, error, submitHandler } = useFullForm({
    defaultValues: { password: "" },
    onSubmit: (data) =>
      api("account-set-password", {
        password: data.password,
      }),
    onComplete,
  });
  return (
    <ModalForm isSubmitting={isSubmitting} submitHandler={submitHandler} submitLabel="Set password" error={error}>
      <FormControl isRequired>
        <FormLabel htmlFor="password-input">password</FormLabel>
        <ControlledInput
          name="password"
          placeholder="new password"
          type="password"
          id="password-input"
          control={control}
        />
        {errors.password && <p>{errors.password.message}</p>}
      </FormControl>
    </ModalForm>
  );
}

function ChangePasswordModal({ isOpen, onComplete }: { isOpen: boolean; onComplete: (didSetPw?: true) => void }) {
  return (
    <GenericModal isOpen={isOpen} onClose={onComplete} title="Set password">
      <ModalChangePasswordForm
        onComplete={() => {
          onComplete(true);
        }}
      />
    </GenericModal>
  );
}

export function SetPasswordButton(): ReactElement {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { reload } = useRouter();
  return (
    <>
      <Button onClick={onOpen} variant="outline">
        Set password
      </Button>
      <ChangePasswordModal
        isOpen={isOpen}
        onComplete={(didSet) => {
          onClose();
          if (didSet) reload();
        }}
      />
    </>
  );
}
