import { InputGroup } from "@blueprintjs/core";
import { Controller, Control } from "react-hook-form";
import React from "react";

export function ControlledInputGroup({
  control,
  name,
}: { control: Control; name: string } & React.ComponentProps<
  typeof InputGroup
>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ onChange, onBlur, value, name }) => (
        <InputGroup
          value={value}
          name={name}
          onBlur={onBlur}
          onChange={(e: any) => {
            onChange(e.nativeEvent.target.value);
          }}
        />
      )}
    />
  );
}
