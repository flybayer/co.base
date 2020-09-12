import "../styles/globals.css";
import { DocProvider } from "../cloud-docs/client";

const stores = require("../stores");

function MyApp({ Component, pageProps }) {
  return (
    <DocProvider stores={stores}>
      <Component {...pageProps} />
    </DocProvider>
  );
}

export default MyApp;
