"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  DoorOpen,
  Sofa,
  LayoutGrid,
  Container,
  Box,
  Plus,
  Search,
  ArrowLeftRight,
  Camera,
  Barcode,
  FileEdit,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useQuickMove } from "@/lib/app/contexts/quick-move-context";
import { useAddItem } from "@/lib/app/contexts/add-item-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ENTITY_ITEMS = [
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
    ],
  },
] as const;

/** Кнопка действия в нижней панели — единый стиль для всех иконок. */
function BarActionButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon-2xl"
      className="rounded-full"
      {...props}
    >
      {children}
    </Button>
  );
}

export function MobileBottomBar() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { setOpen: setQuickMoveOpen } = useQuickMove();
  const {
    openByPhoto,
    openByBarcode,
    openByForm,
    isBarcodeLookupLoading,
    isRecognizeLoading,
  } = useAddItem();

  if (!isMobile) return null;

  const isAddDisabled = isBarcodeLookupLoading || isRecognizeLoading;

  return (
    <div
      className={cn(
        "fixed bottom-2 left-1/2 -translate-x-1/2 rounded-full p-2 z-40 flex",
        "bg-background/50 backdrop-blur border",
      )}
    >
      <div className="min-w-0 flex gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <BarActionButton aria-label="Выбрать сущность">
                <LayoutGrid data-icon="inline-start" />
              </BarActionButton>
            }
          />
          <DropdownMenuContent side="top" align="start" className="w-48">
            {ENTITY_ITEMS.map((group) => (
              <DropdownMenuGroup key={group.group}>
                <DropdownMenuLabel>{group.group}</DropdownMenuLabel>
                {group.items.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <BarActionButton disabled={isAddDisabled} aria-label="Создать вещь">
                <Plus data-icon="inline-start" />
              </BarActionButton>
            }
          />
          <DropdownMenuContent side="top" align="center" className="w-48">
            <DropdownMenuItem onClick={openByPhoto} disabled={isAddDisabled}>
              <Camera className="h-4 w-4" />
              По фото
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openByBarcode} disabled={isAddDisabled}>
              <Barcode className="h-4 w-4" />
              По штрихкоду
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openByForm}>
              <FileEdit className="h-4 w-4" />
              Стандартно
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 flex">
        <BarActionButton
          nativeButton={false}
          render={<Link href="/" />}
          aria-label="Поиск"
        >
          <Search data-icon="inline-start" />
        </BarActionButton>
      </div>

      <div className="min-w-0 flex">
        <BarActionButton
          onClick={() => setQuickMoveOpen(true)}
          aria-label="Быстрое перемещение"
        >
          <ArrowLeftRight data-icon="inline-start" />
        </BarActionButton>
      </div>
    </div>
  );
}
