import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@chakra-ui/core";
import Link from "next/link";
import { explodeAddress } from "../api-utils/explodeAddress";

export default function DashboardBreadcrumbs({
  siteName,
  address,
  nodeFeature,
}: {
  siteName: string;
  address: string[];
  nodeFeature?: string;
}) {
  return (
    <Breadcrumb>
      <BreadcrumbItem>
        <Link href={`/sites/${siteName}`} passHref>
          <BreadcrumbLink>{siteName}</BreadcrumbLink>
        </Link>
      </BreadcrumbItem>
      {explodeAddress(address).map(({ key, fullAddress }) => (
        <BreadcrumbItem key={fullAddress}>
          <Link href={`/sites/${siteName}/dashboard${fullAddress}`} passHref>
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
