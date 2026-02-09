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
} from "@/components/ui/sidebar"
import { SecondaryMenu } from "./secondary-menu";
import { PrimaryMenu } from "./primary-menu";
import Link from "next/link";
import { QrCodeIcon, ArrowLeftRight } from "lucide-react";
import { useQuickMove } from "@/lib/app/contexts/quick-move-context";

const AppSidebar = () => {
  const { setOpen } = useQuickMove();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <Logo size="sm" showText={false} />
              <span className="text-sm font-bold">FindMyStuff</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={() => setOpen(true)}
            >
              <QrCodeIcon />
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
