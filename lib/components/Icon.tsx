import { PropsOf } from "@chakra-ui/core";
import { ReactElement } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-svg-core";

export function Icon({
  color,
  icon,
  size,
}: {
  color?: string;
  icon: IconName;
  size?: PropsOf<typeof FontAwesomeIcon>["size"];
}): ReactElement {
  return <FontAwesomeIcon color={color} icon={["fal", icon]} size={size} />;
}
