"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import UsersManager from "@/components/managers/users-manager";

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!user) {
    return null;
  }

  return <UsersManager />;
}
