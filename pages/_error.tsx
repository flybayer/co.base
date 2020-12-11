import { NextApiResponse } from "next";
import { ReactElement } from "react";

function Error({ statusCode }: { statusCode?: number }): ReactElement {
  console.log("eee");
  return <p>Ok, error accurerd</p>;
  // return <p>{statusCode ? `An error ${statusCode} occurred on server` : "An error occurred on client"}</p>;
}

Error.getInitialProps = ({ res, err }: { res: NextApiResponse; err: any }) => {
  // console.log("-ayao----------");
  // console.log({ res, err });
  // console.log("-----------");
  // const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  // return { statusCode };
  return {};
};

export default Error;
