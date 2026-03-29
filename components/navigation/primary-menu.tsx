"use client";

import { usePathname } from "next/navigation";
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
import { PRIMARY_NAVIGATION_GROUPS } from "@/components/navigation/navigation-groups";

export const PrimaryMenu = () => {
  const pathname = usePathname();

  const { state, isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const isMenuItemActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return PRIMARY_NAVIGATION_GROUPS.map((group) => (
    <Collapsible defaultOpen key={group.group} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {group.items.map((item) => (
              <Tooltip key={item.href} disabled={state !== "collapsed"}>
                <TooltipTrigger
                  render={
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={isMenuItemActive(item.href)}
                        render={<Link href={item.href} />}
                        onClick={closeMobileSidebar}
                      >
                        <item.icon data-icon="inline-start" /> {item.label}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  }
                />
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