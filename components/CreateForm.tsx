import {
  Button,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Select,
  Spinner,
} from "@chakra-ui/core";
import { useRouter } from "next/router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { api } from "../api-utils/api";
import {
  NodeType,
  NODE_TYPES,
  SchemaType,
  VALUE_TYPES,
} from "../data/NodeSchema";
import ControlledInput from "./ControlledInput";

export function CreateNodeForm({
  address,
  siteName,
}: {
  address: string[];
  siteName: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<NodeType>("record");
  const { push } = useRouter();
  const { register, handleSubmit, errors, control } = useForm({
    mode: "onBlur",
    defaultValues: {
      name: "",
      schemaType: "object",
    },
  });
  return (
    <>
      <h3>
        {address.length
          ? `Create new ${address.join("/")} record`
          : `Create new node under ${siteName}`}
      </h3>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("node-create", {
            address,
            siteName,
            type,
            ...data,
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
          <FormLabel htmlFor="node-type-input">Type</FormLabel>
          <Select
            id="node-type-input"
            onChange={(e) => {
              setType(e.target.value as NodeType);
            }}
          >
            {NODE_TYPES.map(({ key, name }) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="record-type-select">Record Schema Type</FormLabel>
          <Controller
            control={control}
            name="schemaType"
            render={({ value, onChange }) => (
              <Select value={value} onChange={onChange} id="record-type-select">
                {VALUE_TYPES.map(({ key, name }) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </Select>
            )}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="name-input">Unique Key (URL friendly)</FormLabel>
          <ControlledInput
            id="name-input"
            placeholder="my-data"
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
