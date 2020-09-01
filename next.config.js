const withMdxEnhanced = require("next-mdx-enhanced");

const remarkPlugins = [
  require("remark-autolink-headings"),
  require("remark-slug"),
];

module.exports = withMdxEnhanced({
  layoutPath: "layouts",
  defaultLayout: true,
  fileExtensions: ["mdx"],
  remarkPlugins,
  rehypePlugins: [],
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
