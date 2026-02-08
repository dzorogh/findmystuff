"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, UserIcon, Settings, Loader2Icon, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/users/context";
import { signOut } from "@/lib/auth/sign-out";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";


export const SecondaryMenu = () => {
    const pathname = usePathname();
    const { user } = useUser();
    const email = user?.email;
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
        }, 100);
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error("Sign out failed:", err);
            toast.error(err instanceof Error ? err.message : "Не удалось выйти из аккаунта");
        }
    };

    const handleThemeToggle = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    const themeIcon = !mounted ? undefined : resolvedTheme === "dark" ? Moon : Sun;

    const menuItems = [
        {
            label: "Пользователи",
            href: "/users",
            icon: Users
        },
        {
            label: "Настройки",
            href: "/settings",
            icon: Settings
        },
        {
            label: email,
            href: "/account",
            icon: UserIcon
        },
        {
            label: "Сменить тему",
            onClick: handleThemeToggle,
            icon: themeIcon,
        },
        {
            label: "Выйти",
            onClick: handleSignOut,
            icon: LogOut,
        },
    ];

    return (
        <ScrollArea>
            <div className="flex flex-col gap-1">
                {menuItems.map((item, index) => (
                    <Button
                        key={index}
                        variant={item.href ? (pathname.startsWith(item.href) ? "secondary" : "ghost") : "ghost"}
                        nativeButton={!item.href}
                        render={item.href ? <Link href={item.href} /> : undefined}
                        onClick={item.onClick}
                        className="w-full justify-start"
                    >
                        {item.icon ? <item.icon data-icon="inline-start" /> : <Loader2Icon data-icon="inline-start" className="animate-spin" />}
                        {item.label ? item.label : <Skeleton className="h-4 w-32 bg-foreground/20" />}
                    </Button>
                ))}
            </div>
        </ScrollArea>
    );
};