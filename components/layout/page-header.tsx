import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "./page-breadcrumb";
import { PageTitle } from "./page-title";

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
        <Skeleton className="h-8 w-80" />
      </div>
    );
  }

  const headerActions = actions ?? null;

  return (
    <div className="flex justify-between items-end gap-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <PageBreadcrumb path={breadcrumb} />
        </div>
        <div className="flex justify-between items-center">
          <PageTitle title={title} />
        </div>
      </div>
      <div className="flex shrink-0 items-center">
        {headerActions}
      </div>
    </div>
  );
};