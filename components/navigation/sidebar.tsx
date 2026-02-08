import Link from "next/link";
import Logo from "@/components/common/logo";
import { cn } from "@/lib/utils";
import { SecondaryMenu } from "./secondary-menu";
import { PrimaryMenu } from "./primary-menu";

const Sidebar = ({ className }: { className?: string }) => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex h-full flex-col z-40", className)}>
        <div className="h-16 flex items-center px-3 border-b shrink-0">
          <Link href="/" className="flex items-center">
            <Logo size="md" showText={true} />
          </Link>
        </div>
        <div className="p-2 flex-grow">
          <PrimaryMenu />
        </div>
        <div className="border-t p-2">
          <SecondaryMenu />
        </div>
      </aside>

      {/* Mobile Bottom Nav: 2 links | center Quick Move | 2 links
      <nav className="md:hidden bg-background">
        <div className="flex h-[calc(var(--app-bottom-nav-height)+var(--app-safe-bottom))] items-center justify-between gap-1 px-1 pb-[var(--app-safe-bottom)]">
          <Link
            href="/rooms"
            aria-current={pathname.startsWith("/rooms") ? "page" : undefined}
            aria-label="Помещения"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/rooms") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="h-5 w-5" />
            <span className="sr-only">Помещения</span>
          </Link>
          <Link
            href="/places"
            aria-current={pathname.startsWith("/places") ? "page" : undefined}
            aria-label="Места"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/places") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Warehouse className="h-5 w-5" />
            <span className="sr-only">Места</span>
          </Link>
          <Button
            type="button"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full mx-4"
            onClick={() => setQuickMoveOpen(true)}
            aria-label="Быстрое перемещение"
          >
            <ArrowRightLeft className="h-6 w-6" />
          </Button>
          <Link
            href="/containers"
            aria-current={pathname.startsWith("/containers") ? "page" : undefined}
            aria-label="Контейнеры"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/containers") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Container className="h-5 w-5" />
            <span className="sr-only">Контейнеры</span>
          </Link>
          <Link
            href="/items"
            aria-current={pathname.startsWith("/items") ? "page" : undefined}
            aria-label="Вещи"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition-colors",
              pathname.startsWith("/items") ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Box className="h-5 w-5" />
            <span className="sr-only">Вещи</span>
          </Link>
        </div>
      </nav> */}
    </>
  );
};

export default Sidebar;
