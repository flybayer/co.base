import { NextApiRequest, NextApiResponse } from "next";
import { database } from "../../data/database";
import { sendEmail } from "../../api-utils/email";
import { getRandomLetters } from "../../api-utils/getRandomLetters";
import { Error400 } from "../../api-utils/Errors";
import { apiRespond } from "../../api-utils/apiRespond";
import setCookie from "../../api-utils/setCookie";
import { parseCookies, destroyCookie } from "nookies";
import redirect from "../../api-utils/redirect";

async function logout(cookies: any, res: NextApiResponse) {
  const logoutToken = cookies.AvenSessionLogoutToken;
  const sessionToken = cookies.AvenSessionToken;
  if (logoutToken) {
    console.log("log out logoutToken ", logoutToken);
    await database.session.delete({
      where: { logoutToken },
    });
  }
  if (sessionToken) {
    console.log("log out sessionToken ", sessionToken);
    await database.session.delete({
      where: { token: sessionToken },
    });
  }
  return {};
}

async function handleAction(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parseCookies({ req });
  destroyCookie({ res }, "AvenSessionLogoutToken");
  destroyCookie({ res }, "AvenSessionToken");
  return await logout(cookies, res);
}

export default (req: NextApiRequest, res: NextApiResponse) => {
  apiRespond(res, handleAction(req, res));
};
