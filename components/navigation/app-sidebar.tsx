"use client";

import { useState } from "react";
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
import QuickMoveDialog from "@/components/quick-move/quick-move-dialog";

const AppSidebar = () => {
  const [quickMoveOpen, setQuickMoveOpen] = useState(false);

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
              onClick={() => setQuickMoveOpen(true)}
            >
              <QrCodeIcon />
              Перемещение
              <ArrowLeftRight data-icon="inline-end" className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <QuickMoveDialog
        open={quickMoveOpen}
        onOpenChange={setQuickMoveOpen}
      />

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
