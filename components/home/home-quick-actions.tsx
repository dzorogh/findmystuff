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
  colorClass: string;
  gradientClass: string;
}

const HOME_QUICK_ACTIONS: HomeQuickAction[] = [
  {
    label: "Вещи",
    icon: Package,
    href: "/items",
    description: "Просмотр всех вещей",
    colorClass: "text-blue-500 dark:text-blue-400",
    gradientClass: "from-blue-500/10 to-blue-500/5 group-hover:from-blue-500/20 group-hover:to-blue-500/10",
  },
  {
    label: "Места",
    icon: LayoutGrid,
    href: "/places",
    description: "Просмотр всех мест",
    colorClass: "text-emerald-500 dark:text-emerald-400",
    gradientClass: "from-emerald-500/10 to-emerald-500/5 group-hover:from-emerald-500/20 group-hover:to-emerald-500/10",
  },
  {
    label: "Контейнеры",
    icon: Container,
    href: "/containers",
    description: "Просмотр всех контейнеров",
    colorClass: "text-orange-500 dark:text-orange-400",
    gradientClass: "from-orange-500/10 to-orange-500/5 group-hover:from-orange-500/20 group-hover:to-orange-500/10",
  },
  {
    label: "Помещения",
    icon: DoorOpen,
    href: "/rooms",
    description: "Просмотр всех помещений",
    colorClass: "text-purple-500 dark:text-purple-400",
    gradientClass: "from-purple-500/10 to-purple-500/5 group-hover:from-purple-500/20 group-hover:to-purple-500/10",
  },
  {
    label: "Здания",
    icon: Building2,
    href: "/buildings",
    description: "Просмотр всех зданий",
    colorClass: "text-rose-500 dark:text-rose-400",
    gradientClass: "from-rose-500/10 to-rose-500/5 group-hover:from-rose-500/20 group-hover:to-rose-500/10",
  },
  {
    label: "Мебель",
    icon: Sofa,
    href: "/furniture",
    description: "Просмотр всей мебели",
    colorClass: "text-indigo-500 dark:text-indigo-400",
    gradientClass: "from-indigo-500/10 to-indigo-500/5 group-hover:from-indigo-500/20 group-hover:to-indigo-500/10",
  },
];

export function HomeQuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {HOME_QUICK_ACTIONS.map((action) => (
        <Link key={action.href} href={action.href} className="group outline-none">
          <Card className="relative overflow-hidden border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 h-full">
            {/* Soft background glow on hover */}
            <div className={`absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${action.gradientClass} mix-blend-overlay pointer-events-none`} />
            
            <CardHeader className="p-6 relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-xl bg-gradient-to-br ${action.gradientClass} p-3 ring-1 ring-inset ring-foreground/5 shadow-sm transition-colors duration-300`}>
                  <action.icon className={`h-6 w-6 ${action.colorClass}`} />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-secondary">
                   <ArrowRight className={`h-4 w-4 ${action.colorClass} -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100`} />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold mb-1">{action.label}</CardTitle>
              <CardDescription className="text-sm font-medium line-clamp-2">
                {action.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
