import { DocProvider, useClient, useValue } from "../cloud-docs/client";
import Head from "next/head";
import { useClaps } from "../stores/Claps";

export function Claps() {
  const clapsDoc = useClaps();
  const value = useValue(clapsDoc);

  return (
    <>
      <Head>
        <title>Clap Here</title>
      </Head>
      <h1>Clap Example</h1>
      {value && <h2>{value.count} claps</h2>}
      <button
        onClick={() => {
          clapsDoc.actions.clapOnce({});
        }}
      >
        Clap
      </button>
    </>
  );
}

export default function ClapsPage() {
  return <Claps />;
}
