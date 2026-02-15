"use client";

import Logo from "@/components/common/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { SecondaryMenu } from "./secondary-menu";
import { PrimaryMenu } from "./primary-menu";
import Link from "next/link";
import { QrCodeIcon, ArrowLeftRight } from "lucide-react";
import { useQuickMove } from "@/lib/app/contexts/quick-move-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


const AppSidebar = () => {
  const { setOpen: setQuickMoveOpen } = useQuickMove();
  const { open, state, isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <Tooltip disabled={state !== "collapsed"}>
            <TooltipTrigger render={
              <SidebarMenuItem className="h-12 flex items-center">
                <SidebarMenuButton render={<Link href="/" />} onClick={closeMobileSidebar}>
                  <Logo data-icon="inline-start" size="sm" showText={false} />
                  {open ? <span className="text-sm font-bold">FindMyStuff</span> : null}
                </SidebarMenuButton>
              </SidebarMenuItem>
            } />
            <TooltipContent side="right" align="center">
              Главная
            </TooltipContent>
          </Tooltip>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="default"
              onClick={() => {
                closeMobileSidebar();
                setQuickMoveOpen(true);
              }}
              tooltip="Перемещение"
            >
              <QrCodeIcon data-icon="inline-start" />
              Перемещение
              <ArrowLeftRight data-icon="inline-end" className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <PrimaryMenu />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SecondaryMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
