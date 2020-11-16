import { Button, FormControl, FormLabel, Spinner } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../api-utils/api";
import ControlledInput from "./ControlledInput";

export function CreateNodeForm({
  address,
  siteName,
}: {
  address: string[];
  siteName: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { push } = useRouter();
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
    },
  });
  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("node-create", {
            address,
            siteName,
            name: data.name,
          })
            .then(() => {
              push(
                `/sites/${siteName}/dashboard/${[...address, data.name].join(
                  "/"
                )}`
              );
            })
            .catch((e) => {
              console.error(e);
              alert("failed");
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        })}
      >
        <FormControl>
          <FormLabel htmlFor="name-input">Public Slug</FormLabel>
          <ControlledInput
            id="name-input"
            placeholder="mysite"
            name="name"
            control={control}
          />
        </FormControl>
        <Button type="submit">Create</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}
