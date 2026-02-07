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
}

export const PageHeader = ({ isLoading, title, ancestors }: PageHeaderProps) => {
    const breadcrumb = ancestors ? [...ancestors, { label: title, href: "" }] : [{ label: title, href: "" }];

    if (isLoading) {
        return (
            <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-9 w-64" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <PageBreadcrumb path={breadcrumb} />
            <PageTitle title={title} />
        </div>
    );
};