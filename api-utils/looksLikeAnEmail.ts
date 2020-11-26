export function looksLikeAnEmail(str: string) {
  return !!str.match(/\@/);
}
