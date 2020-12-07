export default function redirect(res: any, path: string) {
  res.redirect(302, path);
}
