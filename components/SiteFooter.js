import React from "react";
import MainWidth from "./MainWidth";

export default function SiteFooter() {
  return (
    <>
      <div
        style={{
          borderTop: "1px solid #b1c8db",
          backgroundColor: "#d6e2ed",
          minHeight: 150,
          background: "url('/img/CloudFooter.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "fill",
        }}
      >
        <MainWidth></MainWidth>
      </div>
      <div
        style={{
          borderTop: "1px solid #b1c8db",
          backgroundColor: "#222",
          minHeight: 100,
        }}
      >
        <MainWidth></MainWidth>
      </div>
    </>
  );
}
