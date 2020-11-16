import Link from "next/link";

export default function NodeChildren({
  siteName,
  address,
  childs,
}: {
  siteName: string;
  address: string[];
  childs: Array<{
    key: string;
  }>;
}) {
  return (
    <>
      {childs.map((child) => (
        <Link
          key={child.key}
          href={`/sites/${siteName}/dashboard/${[...address, child.key].join(
            "/"
          )}`}
        >
          {child.key}
        </Link>
      ))}
    </>
  );
}
