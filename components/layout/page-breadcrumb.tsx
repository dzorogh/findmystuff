import Link from "next/link";
import { HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

interface PageBreadcrumbProps {
  path: {
    label: string;
    href: string;
  }[];
}

export function PageBreadcrumb({ path }: PageBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/" />}>
            <HomeIcon className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {path.map((item, index) => (
          <Fragment key={index}>
            <BreadcrumbItem key={index}>
              {index === path.length - 1 ?
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
                :
                <BreadcrumbLink render={<Link href={item.href} />}>
                  {item.label}
                </BreadcrumbLink>
              }
            </BreadcrumbItem>
            {index !== path.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb >
  );
}
