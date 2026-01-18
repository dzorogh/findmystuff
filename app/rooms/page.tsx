"use client";

import { useState } from "react";
import RoomsList from "@/components/lists/rooms-list";
import AddRoomForm from "@/components/forms/add-room-form";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";

export default function RoomsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleRoomAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          icon={Building2}
          title="Помещения"
          description="Просмотр и поиск всех помещений в складе"
          action={
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Добавить помещение
            </Button>
          }
        />
        <RoomsList refreshTrigger={refreshTrigger} />
        <AddRoomForm
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={handleRoomAdded}
        />
      </div>
    </div>
  );
}
