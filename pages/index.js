import Head from "next/head";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <>
      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
      `}</style>
      <div className={styles.container}>
        <main>
          <h1 className={styles.title}>Aven: Coming Soon</h1>
        </main>
      </div>
    </>
  );
}

Home.meta = { title: "Aven" };
