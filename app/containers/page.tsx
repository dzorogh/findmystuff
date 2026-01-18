"use client";

import { useState } from "react";
import ContainersList from "@/components/lists/containers-list";
import AddContainerForm from "@/components/forms/add-container-form";
import { Button } from "@/components/ui/button";
import { Container, Plus } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { PageHeader } from "@/components/common/page-header";

export default function ContainersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const handleContainerAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          icon={Container}
          title="Контейнеры"
          description="Просмотр и поиск всех контейнеров в складе"
          action={
            isAdmin ? (
              <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Добавить контейнер
              </Button>
            ) : undefined
          }
        />
        <ContainersList refreshTrigger={refreshTrigger} />
        {isAdmin && (
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
