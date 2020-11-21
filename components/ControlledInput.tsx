import { Input, Textarea } from "@chakra-ui/core";
import { FormEvent } from "react";
import { Controller, Control } from "react-hook-form";

export default function ControlledInput({
  control,
  name,
  ...props
}: { control: Control; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ onChange, onBlur, value, name }) => {
        if (props.type === "textarea") {
          return (
            <Textarea
              value={value}
              name={name}
              onInput={(e: FormEvent<HTMLTextAreaElement>) => {
                onChange((e.target as any).value);
              }}
            />
          );
        }
        return (
          <Input
            value={value}
            name={name}
            onBlur={onBlur}
            onChange={(e: any) => {
              onChange(e.nativeEvent.target.value);
            }}
            {...props}
          />
        );
      }}
    />
  );
}
