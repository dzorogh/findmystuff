import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "./page-breadcrumb";
import { PageTitle } from "./page-title";
import { SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";

interface PageHeaderProps {
  isLoading?: boolean;
  title: string;
  ancestors?: {
    label: string;
    href: string;
  }[];
  /** Кнопки шапки (действия страницы). */
  actions?: React.ReactNode;
}

export const PageHeader = ({
  isLoading,
  title,
  ancestors,
  actions,
}: PageHeaderProps) => {
  const breadcrumb = ancestors
    ? [...ancestors, { label: title, href: "" }]
    : [{ label: title, href: "" }];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1">
        <div>
          <Skeleton className="h-6 w-60" />
        </div>
        <Skeleton className="h-8 w-60" />
      </div>
    );
  }

  const headerActions = actions ?? null;

  return (
    <div className="">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-center"
        />
        <PageBreadcrumb path={breadcrumb} />
      </div>
      <div className="flex flex-grow justify-between items-center">
        <div className="truncate">
          <PageTitle title={title} />
        </div>
        <div className="flex shrink-0 items-center">
          {headerActions}
        </div>
      </div>
    </div>
  );
};