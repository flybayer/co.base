export default function PostButton({
  action,
  primary,
  children,
}: React.PropsWithChildren<{ action: string; primary?: boolean }>) {
  return (
    <form method="POST" action={action}>
      <button type="submit" className="bp3-button bp3-intent-primary">
        <span className="bp3-button-text">{children}</span>
      </button>
    </form>
  );
}
