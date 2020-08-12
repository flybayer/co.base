import React from "react";
import VideoSection from "../components/VideoSection";
import Main from "../components/Main";

export default function Layout(frontMatter) {
  return ({ children: content }) => {
    // React hooks, for example `useState` or `useEffect`, go here.
    const vimeoId = frontMatter?.vimeoId;
    console.log(vimeoId);
    return (
      <div>
        {vimeoId && <VideoSection vimeoId={vimeoId} />}
        <Main>
          <h1>{frontMatter.title}</h1>
          {content}
        </Main>
      </div>
    );
  };
}
