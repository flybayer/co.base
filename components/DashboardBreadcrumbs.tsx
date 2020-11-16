import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/core";
import Link from "next/link";

export default function DashboardBreadcrumbs({
  siteName,
  address,
  nodeFeature,
}: {
  siteName: string;
  address: string[];
  nodeFeature?: string;
}) {
  const fullAddress: Array<{ key: string; address: string }> = [];
  let walkingFullAddress = "";
  address.forEach((key) => {
    walkingFullAddress += `/${key}`;
    fullAddress.push({ key, address: walkingFullAddress });
  });
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <Link href={`/sites/${siteName}/dashboard`} passHref>
          <BreadcrumbLink>{siteName}</BreadcrumbLink>
        </Link>
      </BreadcrumbItem>
      {fullAddress.map(({ key, address }) => (
        <BreadcrumbItem key={address}>
          <Link href={`/sites/${siteName}/dashboard${address}`} passHref>
            <BreadcrumbLink>{key}</BreadcrumbLink>
          </Link>
        </BreadcrumbItem>
      ))}
      {nodeFeature && (
        <BreadcrumbItem>
          <BreadcrumbLink>{nodeFeature}</BreadcrumbLink>
        </BreadcrumbItem>
      )}
    </Breadcrumb>
  );
}
