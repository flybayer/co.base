import { Button, FormControl, FormLabel, Select, Spinner } from "@chakra-ui/core";
import { useRouter } from "next/router";
import { ReactElement, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { api } from "../server/api";
import { handleAsync } from "../data/handleAsync";
import { NodeSchema, NodeType, NODE_TYPES, VALUE_TYPES } from "../../packages/client/src/NodeSchema";
import ControlledInput from "./ControlledInput";

export function CreateAnyNodeForm({ address, siteName }: { address: string[]; siteName: string }): ReactElement {
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
      <h3>{address.length ? `Create under ${address.join("/")}` : `Create under ${siteName}`}</h3>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          handleAsync(
            api("node-post", {
              address,
              siteName,
              type,
              ...data,
            }),
            () => {
              push(`/s/${siteName}/dashboard/${[...address, data.name].join("/")}`);
            },
          ).finally(() => {
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
          <ControlledInput id="name-input" placeholder="my-data" name="name" control={control} />
        </FormControl>
        <Button type="submit">Create</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export function CreateRecordSetNodeForm({ address, siteName }: { address: string[]; siteName: string }): ReactElement {
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
      <h3>Create &quot;{address.join("/")}&quot; record</h3>
      <form
        onSubmit={handleSubmit((data) => {
          setIsSubmitting(true);
          api("node-post", {
            address,
            siteName,
            ...data,
          })
            .then(() => {
              push(`/s/${siteName}/dashboard/${[...address, data.name].join("/")}`);
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
          <FormLabel htmlFor="name-input">Unique Key (URL friendly)</FormLabel>
          <ControlledInput id="name-input" placeholder="my-data" name="name" control={control} />
        </FormControl>
        <Button type="submit">Create</Button>
        {isSubmitting && <Spinner size="sm" />}
      </form>
    </>
  );
}

export function CreateNodeForm({
  address,
  siteName,
  parentSchema,
}: {
  address: string[];
  siteName: string;
  parentSchema?: NodeSchema;
}): ReactElement | null {
  if (parentSchema?.type === "record") {
    return null;
  }
  if (parentSchema?.type === "record-set") {
    return <CreateRecordSetNodeForm address={address} siteName={siteName} />;
  }
  return <CreateAnyNodeForm address={address} siteName={siteName} />;
}
