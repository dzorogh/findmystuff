"use client";

import { LogOut, UserIcon, Settings, Loader2Icon, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/lib/auth/sign-out";
import { toast } from "sonner";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";


export const SecondaryMenu = () => {
    const pathname = usePathname();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error("Sign out failed:", err);
            toast.error(err instanceof Error ? err.message : "Не удалось выйти из аккаунта");
        }
    };

    const menuItems = [
        {
            label: "Пользователи",
            href: "/users",
            icon: Users
        },
        {
            label: "Настройки",
            href: "/settings",
            icon: Settings
        },
        {
            label: "Аккаунт",
            href: "/account",
            icon: UserIcon
        },
        {
            label: "Выйти",
            onClick: handleSignOut,
            icon: LogOut,
        },
    ];

    return (
        <SidebarMenu>
            {menuItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                        size="sm"
                        key={index}
                        render={item.href ? <Link href={item.href} /> : undefined}
                        onClick={item.onClick}
                        isActive={item.href ? pathname.startsWith(item.href) : false}
                    >
                        {item.icon ? <item.icon data-icon="inline-start" /> : <Loader2Icon data-icon="inline-start" className="animate-spin" />}
                        {item.label ? item.label : <Skeleton className="h-4 w-32 bg-foreground/20" />}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
};