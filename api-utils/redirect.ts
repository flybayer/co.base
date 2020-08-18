export default function redirect(context: { res: any }, path: string) {
  // @ts-ignore // redirect actually exists because this is an express response object
  context.res.redirect(path);
}
