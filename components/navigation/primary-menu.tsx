"use client";

import { usePathname } from "next/navigation";
import { Building2, Warehouse, Container, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PrimaryMenu = () => {
    const pathname = usePathname();

    const menuItems = [
        { href: "/rooms", label: "Помещения", icon: Building2 },
        { href: "/places", label: "Места", icon: Warehouse },
        { href: "/containers", label: "Контейнеры", icon: Container },
        { href: "/items", label: "Вещи", icon: Box },
    ];

    return (
        <ScrollArea>
            <div className="flex flex-col gap-1">
                {menuItems.map((item) => (
                    <Button
                        className="w-full justify-start"
                        key={item.href}
                        variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
                        nativeButton={false}
                        render={<Link href={item.href}><item.icon data-icon="inline-start" /> {item.label}</Link>}
                    />
                ))}
            </div>
        </ScrollArea>
    );
};