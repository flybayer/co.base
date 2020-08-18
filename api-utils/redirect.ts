export default function redirect(res: any, path: string) {
  console.log("tryi", path);
  // @ts-ignore // redirect actually exists because this is an express response object
  res.redirect(path);
  res.isSent = true;
}
