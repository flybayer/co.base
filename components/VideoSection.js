import React from "react";
import MainWidth from "./MainWidth";

export default function VideoSection({ vimeoId }) {
  return (
    <div
      style={{
        backgroundColor: "#111",
        padding: "10px 0",
      }}
    >
      <MainWidth>
        <div
          style={
            {
              // maxWidth: 1280,
              // maxHeight: 720,
              // margin: "0 auto",
            }
          }
        >
          <div
            style={{
              padding: "56.25% 0 0 0",
              position: "relative",
            }}
          >
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            ></iframe>
          </div>
        </div>
      </MainWidth>
    </div>
  );
}
