"use client";

import { usePathname } from "next/navigation";
import { Home, DoorOpen, Sofa, LayoutGrid, Container, Box } from "lucide-react";
import Link from "next/link";
import {
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const PrimaryMenu = () => {
    const pathname = usePathname();

    const { state, isMobile, setOpenMobile } = useSidebar();

    const closeMobileSidebar = () => {
        if (isMobile) setOpenMobile(false);
    };

    const menuItems = [
        {
            group: "Расположения",
            items: [
                { href: "/buildings", label: "Здания", icon: Home },
                { href: "/rooms", label: "Помещения", icon: DoorOpen },
                { href: "/furniture", label: "Мебель", icon: Sofa },
                { href: "/places", label: "Места", icon: LayoutGrid },
            ],
        },
        {
            group: "Объекты",
            items: [
                { href: "/containers", label: "Контейнеры", icon: Container },
                { href: "/items", label: "Вещи", icon: Box },
            ]
        }
    ];

    return menuItems.map((group) => (
        <Collapsible defaultOpen key={group.group} className="group/collapsible">
            <SidebarGroup>
                <SidebarGroupLabel>
                    {group.group}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {group.items.map((item) => (
                            <Tooltip key={item.href} disabled={state !== "collapsed"}>
                                <TooltipTrigger render={
                                    <SidebarMenuItem>
                                        <SidebarMenuButton
                                            isActive={pathname.startsWith(item.href)}
                                            render={<Link href={item.href} />}
                                            onClick={closeMobileSidebar}
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
                </SidebarGroupContent>
            </SidebarGroup>
        </Collapsible>
    ));
};