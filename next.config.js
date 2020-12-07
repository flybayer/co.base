const withMdxEnhanced = require("next-mdx-enhanced");

const remarkPlugins = [
  require("remark-autolink-headings"),
  require("remark-slug"),
  require("remark-code-titles"),
];

module.exports = withMdxEnhanced({
  layoutPath: "layouts",
  defaultLayout: true,
  fileExtensions: ["mdx"],
  remarkPlugins,
  rehypePlugins: [require("mdx-prism")],
  usesSrc: false,
  extendFrontMatter: {
    process: (mdxContent, frontMatter) => {},
    phase: "prebuild|loader|both",
  },
  reExportDataFetching: false,
})({
  env: {
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  },
});
