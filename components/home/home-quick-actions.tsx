import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Container,
  DoorOpen,
  LayoutGrid,
  Package,
  Sofa,
  type LucideIcon,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HomeQuickAction {
  label: string;
  icon: LucideIcon;
  href: string;
  description: string;
}

const HOME_QUICK_ACTIONS: HomeQuickAction[] = [
  {
    label: "Вещи",
    icon: Package,
    href: "/items",
    description: "Просмотр всех вещей",
  },
  {
    label: "Места",
    icon: LayoutGrid,
    href: "/places",
    description: "Просмотр всех мест",
  },
  {
    label: "Контейнеры",
    icon: Container,
    href: "/containers",
    description: "Просмотр всех контейнеров",
  },
  {
    label: "Помещения",
    icon: DoorOpen,
    href: "/rooms",
    description: "Просмотр всех помещений",
  },
  {
    label: "Здания",
    icon: Building2,
    href: "/buildings",
    description: "Просмотр всех зданий",
  },
  {
    label: "Мебель",
    icon: Sofa,
    href: "/furniture",
    description: "Просмотр всей мебели",
  },
];

export function HomeQuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {HOME_QUICK_ACTIONS.map((action) => (
        <Link key={action.href} href={action.href} className="group">
          <Card className="group-hover:bg-primary/10">
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="rounded-lg bg-primary/10 p-2">
                  <action.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4" />
              </div>
              <CardTitle className="text-lg">{action.label}</CardTitle>
              <CardDescription className="text-sm">
                {action.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
