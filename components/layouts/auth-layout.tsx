"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import Sidebar from "@/components/navigation/sidebar";
import TopBar from "@/components/navigation/top-bar";
import { QuickMoveProvider } from "@/contexts/quick-move-context";
import { PageContainer } from "@/components/layouts/page-container";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const isAuthenticated = Boolean(user);
  const isHomePage = pathname === "/";
  const showTopBar = !isLoading && user;
  const showSidebar = !isLoading && user;

  // Для неавторизованных пользователей - layout без sidebar и отступов
  if (!isLoading && !user) {
    return (
      <div className="h-[100svh] h-[100dvh] overflow-hidden bg-background">
        <main className="h-full overflow-y-auto overscroll-y-auto [-webkit-overflow-scrolling:touch] pt-[var(--app-safe-top)] pb-[var(--app-safe-bottom)]">
          {children}
        </main>
      </div>
    );
  }

  // Grid layout для авторизованных пользователей
  // Desktop: [Sidebar | TopBar+Content]
  // Mobile: [TopBar+Content+BottomNav] - все в grid
  // QuickMoveProvider рендерит один QuickMoveDialog — оба Sidebar (desktop и mobile) используют контекст
  return (
    <QuickMoveProvider>
      <div className="h-[100svh] h-[100dvh] overflow-hidden bg-background grid md:grid-cols-[256px_1fr] grid-rows-[1fr_auto] md:grid-rows-1">
        {/* Desktop Sidebar - первая колонка */}
        {showSidebar && (
          <div className="hidden md:block row-start-1 row-end-2 col-start-1 col-end-2 overflow-y-auto">
            <Sidebar />
          </div>
        )}

        {/* Main content area - вторая колонка на desktop, вся ширина на mobile */}
        <main className="row-start-1 row-end-2 md:row-start-1 md:row-end-2 col-start-1 col-end-2 md:col-start-2 md:col-end-3 flex flex-col overflow-hidden bg-background">
          {/* TopBar - sticky вверху; на десктопе скрыт на главной */}
          {showTopBar && (
            <div className={isHomePage ? "shrink-0 relative z-40 md:hidden" : "shrink-0 relative z-40"}>
              <TopBar />
            </div>
          )}

          {/* Content area - scrollable */}
          <div className="flex-1 overflow-y-auto overscroll-y-auto [-webkit-overflow-scrolling:touch] md:pb-0">
            <PageContainer>{children}</PageContainer>
          </div>
        </main>

        {/* Mobile Bottom Nav - часть grid, внизу */}
        {showSidebar && (
          <div className="md:hidden row-start-2 row-end-3 col-start-1 col-end-2 shrink-0 border-t bg-background">
            <Sidebar />
          </div>
        )}
      </div>
    </QuickMoveProvider>
  );
};
