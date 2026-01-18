"use client";

import { useState } from "react";
import ContainersList from "@/components/containers-list";
import AddContainerForm from "@/components/add-container-form";
import { Button } from "@/components/ui/button";
import { Container, Plus } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function ContainersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useUser();

  const handleContainerAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Container className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Контейнеры</h1>
              <p className="text-muted-foreground">
                Просмотр и поиск всех контейнеров в складе
              </p>
            </div>
          </div>
          {user?.email === "dzorogh@gmail.com" && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить контейнер
            </Button>
          )}
        </div>
        <ContainersList refreshTrigger={refreshTrigger} />
        {user?.email === "dzorogh@gmail.com" && (
          <AddContainerForm
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSuccess={handleContainerAdded}
          />
        )}
      </div>
    </div>
  );
}
