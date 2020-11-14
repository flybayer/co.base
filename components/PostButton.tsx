import { Button } from "@chakra-ui/core";
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

export function LinkButton({
  href,
  children,
}: React.PropsWithChildren<{ href: string }>) {
  return (
    <Link href={href}>
      <Button type="submit">{children}</Button>
    </Link>
  );
}
