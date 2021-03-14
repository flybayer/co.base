import { ReactElement } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconName } from "@fortawesome/fontawesome-svg-core";

const SIZES = {
  "1x": 28,
  lg: 36,
};
const DEFAULT_SIZE: keyof typeof SIZES = "1x";

export function Icon({
  color,
  icon,
  size = DEFAULT_SIZE,
}: {
  color?: string;
  icon: IconName;
  size?: keyof typeof SIZES;
}): ReactElement {
  const sizePx = SIZES[size];
  return (
    <div style={{ width: sizePx, height: sizePx }}>
      <FontAwesomeIcon color={color} icon={["fal", icon]} size="1x" />
    </div>
  );
}
