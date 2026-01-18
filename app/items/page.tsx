"use client";

import { useState } from "react";
import ItemsList from "@/components/lists/items-list";
import AddItemForm from "@/components/forms/add-item-form";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";

export default function ItemsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleItemAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto pb-10 pt-4 px-4 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          icon={Package}
          title="Вещи"
          description="Просмотр и управление всеми вещами в складе"
          action={
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Добавить вещь
            </Button>
          }
        />
        <ItemsList refreshTrigger={refreshTrigger} />
        <AddItemForm
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleItemAdded}
        />
      </div>
    </div>
  );
}
