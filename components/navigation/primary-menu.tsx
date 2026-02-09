"use client";

import { usePathname } from "next/navigation";
import { Building2, Warehouse, Container, Box } from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export const PrimaryMenu = () => {
    const pathname = usePathname();

    const menuItems = [
        { href: "/rooms", label: "Помещения", icon: Building2 },
        { href: "/places", label: "Места", icon: Warehouse },
        { href: "/containers", label: "Контейнеры", icon: Container },
        { href: "/items", label: "Вещи", icon: Box },
    ];

    return (
        <SidebarMenu>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        render={<Link href={item.href} />}
                    >
                        <item.icon data-icon="inline-start" /> {item.label}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
};