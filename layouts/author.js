import createLayout from "./createLayout";

export default function layout(frontMatter) {
  return createLayout(
    frontMatter,
    <>
      <div
        style={{
          backgroundColor: "blue",
          width: 100,
          height: 100,
          borderRadius: 50,
          background: `url('/img/EricVicenti.png')`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <h1>{frontMatter.name}</h1>
    </>
  );
}
