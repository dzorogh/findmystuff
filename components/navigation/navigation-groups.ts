import {
  Box,
  Container,
  DoorOpen,
  Home,
  LayoutGrid,
  Search,
  Sofa,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface NavigationGroup {
  group: string;
  items: NavigationItem[];
}

export const PRIMARY_NAVIGATION_GROUPS: NavigationGroup[] = [
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
      { href: "/search", label: "Поиск", icon: Search },
      { href: "/containers", label: "Контейнеры", icon: Container },
      { href: "/items", label: "Вещи", icon: Box },
    ],
  },
];
