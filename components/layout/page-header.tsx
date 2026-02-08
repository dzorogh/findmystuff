import { Skeleton } from "@/components/ui/skeleton";
import { PageBreadcrumb } from "./page-breadcrumb";
import { PageTitle } from "./page-title";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface PageHeaderProps {
    isLoading?: boolean;
    title: string;
    ancestors?: {
        label: string;
        href: string;
    }[];
    actions?: React.ReactNode;
}

export const PageHeader = ({ isLoading, title, ancestors, actions }: PageHeaderProps) => {
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
            <div className="flex items-center gap-2">
                <SidebarTrigger className="relative right-2" />
                <PageBreadcrumb path={breadcrumb} />
            </div>
            <div className="flex justify-between items-center">
                <PageTitle title={title} />
                {actions}
            </div>
        </div>
    );
};