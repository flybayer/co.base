import React from "react";
import SiteLayout from "../../components/SiteLayout";
import { FrontMatter } from "../../data/frontMatter";
import SiteHead from "../../components/SiteHead";

export default function CourseUpdates({
  children,
  frontMatter,
}: React.PropsWithChildren<{ frontMatter: FrontMatter }>) {
  return (
    <>
      <SiteHead frontMatter={frontMatter} />
      <SiteLayout
        hideFooter
        headContent={null}
        topContent={
          <>
            <iframe
              src="https://cdn.forms-content.sg-form.com/8f21dafc-0547-11eb-be72-8a57c8a473b6"
              style={{
                border: "none",
                display: "flex",
                flexGrow: 1,
                alignSelf: "stretch",
                width: "100%",
                height: "100%",
              }}
            />
          </>
        }
        content={children}
      />
    </>
  );
}
