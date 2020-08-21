export default function redirect(res: any, path: string) {
  // @ts-ignore // redirect actually exists because this is an express response object
  // res.statusCode = 302;
  // res.setHeader("Location", path);

  res.redirect(302, path);
  res.isSent = true;
}
