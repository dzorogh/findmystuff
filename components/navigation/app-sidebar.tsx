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

const AppSidebar = () => {
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
