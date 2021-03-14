import { Button, PropsOf } from "@chakra-ui/core";
import Link from "next/link";
import { Children, ReactElement, ReactNode } from "react";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import styled from "@emotion/styled";
import { Icon } from "./Icon";

export const LeftIconContainer = styled.div`
  padding: 0 10px 0 0;
`;

export const RightIconContainer = styled.div`
  margin: 10px 0 10px 10px;
`;

const ButtonBarContainer = styled.div`
  display: flex;
  margin: 12px 0;
`;
const ButtonBarButtonContainer = styled.div`
  margin: 0 12px 0 0;
`;

export function ButtonBar({ children }: { children: ReactNode }): ReactElement {
  return (
    <ButtonBarContainer>
      {Children.map(children, (child, index) => (
        <ButtonBarButtonContainer>{child}</ButtonBarButtonContainer>
      ))}
    </ButtonBarContainer>
  );
}

export default function PostButton({
  action,
  children,
  method = "POST",
}: React.PropsWithChildren<{
  action: string;
  primary?: boolean;
  method?: string;
}>): ReactElement {
  return (
    <form method={method} action={action}>
      <Button type="submit">{children}</Button>
    </form>
  );
}

type ButtonProps = PropsOf<typeof Button>;

export function LinkButton({
  href,
  children,
  icon,
  ...props
}: React.PropsWithChildren<{ icon?: IconName; href: string } & ButtonProps>): ReactElement {
  return (
    <Link href={href}>
      <Button {...props} variant="outline">
        {icon && (
          <LeftIconContainer>
            <Icon color="#111" icon={icon} size="1x" />
          </LeftIconContainer>
        )}
        {children}
      </Button>
    </Link>
  );
}
