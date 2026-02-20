"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { QrCodeIcon, ArrowLeftRight, Warehouse, ChevronDown, Home, Check } from "lucide-react";
import { useQuickMove } from "@/lib/app/contexts/quick-move-context";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTenant } from "@/contexts/tenant-context";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AppSidebar = () => {
  const { setOpen: setQuickMoveOpen } = useQuickMove();
  const { open, state, isMobile, setOpenMobile } = useSidebar();
  const { tenants, activeTenantId, isLoading, setActiveTenant } = useTenant();

  const activeTenant = tenants.find((t) => t.id === activeTenantId);
  const tenantName = activeTenant?.name ?? "Склад";

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleTenantSelect = async (tenantId: number) => {
    await setActiveTenant(tenantId);
    closeMobileSidebar();
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <DropdownMenu>
            <SidebarMenuItem className="h-12 flex items-center">
              <Tooltip disabled={state !== "collapsed"}>
                <TooltipTrigger render={
                  <DropdownMenuTrigger render={
                    <SidebarMenuButton className="font-bold">
                      <Warehouse data-icon="inline-start" />
                      {state !== "collapsed" ? (
                        <span className="min-w-24 flex-1 truncate text-left">
                          {isLoading ? (
                            <Skeleton className="h-4 w-20" />
                          ) : (
                            <span className="block truncate text-sm">
                              {tenantName}
                            </span>
                          )}
                        </span>
                      ) : null}
                      {state !== "collapsed" ? (
                        <ChevronDown data-icon="inline-end" className="ml-auto size-4 shrink-0 opacity-70" />
                      ) : null}
                    </SidebarMenuButton>
                  } />
                } />
                <TooltipContent side="right" align="center">
                  {tenantName}
                </TooltipContent>
              </Tooltip>
            </SidebarMenuItem>
            <DropdownMenuContent side="right" align="start" className="min-w-48">
              <DropdownMenuItem render={<Link href="/" />} onClick={closeMobileSidebar}>
                <Home className="size-4" />
                Главная
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {tenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  onClick={() => handleTenantSelect(tenant.id)}
                >
                  <span className="flex-1 truncate">{tenant.name ?? "Склад"}</span>
                  {tenant.id === activeTenantId ? <Check className="size-4 shrink-0" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
        <PrimaryMenu />
      </SidebarContent>
      <SidebarFooter>
        <SecondaryMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
