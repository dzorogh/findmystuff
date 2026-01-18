"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MapPin, Container, Building2, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MoveItemFormProps {
  itemId: number;
  itemName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MoveItemForm = ({ itemId, itemName, open, onOpenChange, onSuccess }: MoveItemFormProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [destinationType, setDestinationType] = useState<"container" | "place" | "room">("room");
  const [containers, setContainers] = useState<Array<{ id: number; name: string | null }>>([]);
  const [places, setPlaces] = useState<Array<{ id: number; name: string | null }>>([]);
  const [rooms, setRooms] = useState<Array<{ id: number; name: string | null }>>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user && user.email === "dzorogh@gmail.com") {
      loadContainers();
      loadPlaces();
      loadRooms();
    }
  }, [user]);

  const loadContainers = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("containers")
        .select("id, name")
        .is("deleted_at", null)
        .order("name", { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;
      setContainers(data || []);
    } catch (err) {
      console.error("Ошибка загрузки контейнеров:", err);
    }
  };

  const loadPlaces = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("places")
        .select("id, name")
        .order("name", { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;
      setPlaces(data || []);
    } catch (err) {
      console.error("Ошибка загрузки местоположений:", err);
    }
  };

  const loadRooms = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("rooms")
        .select("id, name")
        .is("deleted_at", null)
        .order("name", { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;
      setRooms(data || []);
    } catch (err) {
      console.error("Ошибка загрузки помещений:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      if (!selectedDestinationId) {
        setError("Выберите место назначения");
        setIsSubmitting(false);
        return;
      }

      const supabase = createClient();

      const { error: insertError } = await supabase.from("transitions").insert({
        item_id: itemId,
        destination_type: destinationType,
        destination_id: parseInt(selectedDestinationId),
      });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setSelectedDestinationId("");
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          onOpenChange(false);
          setSuccess(false);
        }, 1000);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при перемещении вещи"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user || user.email !== "dzorogh@gmail.com") {
    return null;
  }

  const destinations = 
    destinationType === "container" ? containers :
    destinationType === "place" ? places :
    destinationType === "room" ? rooms : [];
  
  const destinationLabel = 
    destinationType === "container" ? "контейнер" :
    destinationType === "place" ? "местоположение" :
    destinationType === "room" ? "помещение" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Переместить вещь</DialogTitle>
          <DialogDescription>
            {itemName || `Item #${itemId}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Тип назначения</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={destinationType === "room" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setDestinationType("room");
                  setSelectedDestinationId("");
                }}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Помещение
              </Button>
              <Button
                type="button"
                variant={destinationType === "place" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setDestinationType("place");
                  setSelectedDestinationId("");
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Место
              </Button>
              <Button
                type="button"
                variant={destinationType === "container" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => {
                  setDestinationType("container");
                  setSelectedDestinationId("");
                }}
              >
                <Container className="mr-2 h-4 w-4" />
                Контейнер
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`destination-${itemId}`}>
              Выберите {destinationLabel}
            </Label>
            <Select
              id={`destination-${itemId}`}
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              disabled={isSubmitting || destinations.length === 0}
            >
              <option value="">-- Выберите {destinationLabel} --</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.id}>
                  {dest.name ||
                    `${destinationType === "container" ? "Контейнер" : destinationType === "place" ? "Место" : "Помещение"} #${dest.id}`}
                </option>
              ))}
            </Select>
            {destinations.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {destinationType === "container"
                  ? "Контейнеры не найдены"
                  : "Местоположения не найдены"}
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Вещь успешно перемещена!
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDestinationId || destinations.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Перемещение...
                </>
              ) : (
                "Переместить"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MoveItemForm;
