const withMdxEnhanced = require("next-mdx-enhanced");

module.exports = withMdxEnhanced({
  layoutPath: "layouts",
  defaultLayout: true,
  fileExtensions: ["mdx"],
  remarkPlugins: [require("remark-autolink-headings")],
  rehypePlugins: [],
  extendFrontMatter: {
    process: (mdxContent, frontMatter) => {},
    phase: "prebuild|loader|both",
  },
})({
  env: {
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  },
});
