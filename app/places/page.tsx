"use client";

import { useState } from "react";
import PlacesList from "@/components/lists/places-list";
import AddPlaceForm from "@/components/forms/add-place-form";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { PageHeader } from "@/components/common/page-header";

export default function PlacesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { isAdmin } = useAdmin();

  const handlePlaceAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          icon={MapPin}
          title="Местоположения"
          description="Просмотр и поиск всех мест в складе"
          action={
            isAdmin ? (
              <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Добавить место
              </Button>
            ) : undefined
          }
        />
        <PlacesList refreshTrigger={refreshTrigger} />
        {isAdmin && (
          <AddPlaceForm
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onSuccess={handlePlaceAdded}
          />
        )}
      </div>
    </div>
  );
}
