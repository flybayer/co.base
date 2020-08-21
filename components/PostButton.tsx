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
      <button type="submit" className="bp3-button bp3-intent-primary">
        <span className="bp3-button-text">{children}</span>
      </button>
    </form>
  );
}
