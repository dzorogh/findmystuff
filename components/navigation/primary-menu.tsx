"use client";

import { usePathname } from "next/navigation";
import { Building2, Warehouse, Container, Box } from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const PrimaryMenu = () => {
    const pathname = usePathname();

    const { state } = useSidebar();

    const menuItems = [
        { href: "/rooms", label: "Помещения", icon: Building2 },
        { href: "/places", label: "Места", icon: Warehouse },
        { href: "/containers", label: "Контейнеры", icon: Container },
        { href: "/items", label: "Вещи", icon: Box },
    ];

    return (
        <SidebarMenu>
            {menuItems.map((item) => (
                <Tooltip key={item.href} disabled={state !== "collapsed"}>
                    <TooltipTrigger render={
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                size="sm"
                                isActive={pathname.startsWith(item.href)}
                                render={<Link href={item.href} />}
                            >
                                <item.icon data-icon="inline-start" /> {item.label}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    } />
                    <TooltipContent side="right" align="center">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            ))}
        </SidebarMenu>
    );
};