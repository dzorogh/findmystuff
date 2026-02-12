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

const AppSidebar = () => {
  const { setOpen: setQuickMoveOpen } = useQuickMove();
  const { toggleSidebar, open } = useSidebar();

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/" />}>
              <Logo data-icon="inline-start" size="sm" showText={false} />
              {open ? <span className="text-sm font-bold">FindMyStuff</span> : null}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={() => setQuickMoveOpen(true)}
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
        <SecondaryMenu toggleSidebar={toggleSidebar} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
