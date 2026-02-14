"use client";

import { usePathname } from "next/navigation";
import { Home, DoorOpen, Sofa, LayoutGrid, Container, Box } from "lucide-react";
import Link from "next/link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const PrimaryMenu = () => {
    const pathname = usePathname();

    const { state } = useSidebar();

    const menuItems = [
        { href: "/buildings", label: "Здания", icon: Home },
        { href: "/rooms", label: "Помещения", icon: DoorOpen },
        { href: "/furniture", label: "Мебель", icon: Sofa },
        { href: "/places", label: "Места", icon: LayoutGrid },
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