import { Button, PropsOf } from "@chakra-ui/core";
import Link from "next/link";

export default function PostButton({
  action,
  primary,
  children,
  method = "POST",
}: React.PropsWithChildren<{
  action: string;
  primary?: boolean;
  method?: string;
}>) {
  return (
    <form method={method} action={action}>
      <Button type="submit">{children}</Button>
    </form>
  );
}

type ButtonProps = PropsOf<typeof Button>;

export function LinkButton({ href, children, ...props }: React.PropsWithChildren<{ href: string } & ButtonProps>) {
  return (
    <Link href={href}>
      <Button {...props}>{children}</Button>
    </Link>
  );
}
