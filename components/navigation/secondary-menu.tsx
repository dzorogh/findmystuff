"use client";

import { LogOut, UserIcon, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
                        render={item.href ? <Link href={item.href} /> : undefined}
                        onClick={item.onClick}
                        isActive={item.href ? pathname.startsWith(item.href) : false}
                    >
                        <item.icon data-icon="inline-start" />
                        {item.label}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
};