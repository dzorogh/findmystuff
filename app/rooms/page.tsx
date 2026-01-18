"use client";

import { useState } from "react";
import RoomsList from "@/components/rooms-list";
import AddRoomForm from "@/components/add-room-form";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function RoomsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { user } = useUser();

  const handleRoomAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Помещения</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Просмотр и поиск всех помещений в складе
              </p>
            </div>
          </div>
          {user?.email === "dzorogh@gmail.com" && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Добавить помещение
            </Button>
          )}
        </div>
        <RoomsList refreshTrigger={refreshTrigger} />
        {user?.email === "dzorogh@gmail.com" && (
          <AddRoomForm
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSuccess={handleRoomAdded}
          />
        )}
      </div>
    </div>
  );
}
