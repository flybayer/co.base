import { css } from "@emotion/react";

export const articleStyles = css`
  hr {
    margin: 40px 0;
    border-top: 1px dashed #556678;
    border-bottom: none;
  }
  code,
  pre {
    margin: 0;
  }
  :not(pre) > code[class*="language-"],
  pre[class*="language-"],
  pre {
    background-color: rgba(255, 255, 255, 0.9);
    padding: 6px 10px;
    border: 1px solid #95a6a8;
    margin: 0;
    overflow: scroll;
  }
  .remark-code-title {
    font-family: "Roboto Mono", monospace;
    padding: 6px 10px;
    color: #374453;
    background: #e0e0ed;
    border: 1px solid #95a6a8;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border-bottom-width: 0;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0;
    width: 100%;
    + pre {
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      margin-top: 0;
    }
  }
  h1 {
    color: #374453;
    font-family: "Young Serif";
    font-size: 64px;
    margin: 60px 0 10px;
  }
  h2 {
    color: #556678;
    font-size: 48px;
    font-family: "Young Serif";
    margin: 48px 0 10px;
  }
  h3 {
    color: #374453;
    font-size: 32px;
    font-family: "Fira Sans", Helvetica, sans-serif;
    margin: 32px 0 10px;
  }
  h4 {
    color: #556678;
    font-size: 28px;
    font-family: "Fira Sans", Helvetica, sans-serif;
    margin: 26px 0 10px;
  }
  p {
    font-family: "Fira Sans", Helvetica, sans-serif;
    color: #374453;
    font-size: 16px;
    margin: 16px 0 16px;
  }
  li {
    font-family: "Fira Sans", Helvetica, sans-serif;
    color: #374453;
    margin: 12px 0 0 0;
    font-size: 16px;
  }
  ul,
  ol {
    margin-left: 36px;
  }
  a {
    color: #374453;
    text-decoration: none;
    border-bottom: 4px solid #abc0c7;
    text-shadow: none;
    transition: background-color 0.45s ease-out, border 0.45s ease-out;
    overflow-wrap: break-word;
    word-break: break-word;
    word-wrap: break-word;
    position: relative;
  }
  a:hover {
    color: #374453;
    transition: background-color 0.25s ease-out, border 0.25s ease-out;
    background-color: rgba(171, 192, 199, 0.75);
    text-shadow: none;
    border-bottom-color: transparent;
    text-decoration: none;
  }
  @media only screen and (max-width: 700px) {
    h1 {
      font-size: 48px;
    }
    h2 {
      font-size: 40px;
    }
    h3 {
      font-size: 36px;
    }
    h4 {
      font-size: 38px;
    }
  }
`;
