"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loader2, MapPin, Container, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditContainerFormProps {
  containerId: number;
  containerName: string | null;
  currentLocation?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditContainerForm = ({
  containerId,
  containerName,
  currentLocation,
  open,
  onOpenChange,
  onSuccess,
}: EditContainerFormProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(containerName || "");
  const [destinationType, setDestinationType] = useState<"place" | "container" | "room" | null>(
    currentLocation?.destination_type as "place" | "container" | "room" | null
  );
  const [containers, setContainers] = useState<Array<{ id: number; name: string | null }>>([]);
  const [places, setPlaces] = useState<Array<{ id: number; name: string | null }>>([]);
  const [rooms, setRooms] = useState<Array<{ id: number; name: string | null }>>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    currentLocation?.destination_id?.toString() || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
      // Исключаем текущий контейнер из списка, чтобы избежать циклических ссылок
      const { data, error: fetchError } = await supabase
        .from("containers")
        .select("id, name")
        .neq("id", containerId)
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
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || currentUser.email !== "dzorogh@gmail.com") {
        setError("У вас нет прав для редактирования контейнеров");
        setIsSubmitting(false);
        return;
      }

      // Обновляем название контейнера
      const { error: updateError } = await supabase
        .from("containers")
        .update({
          name: name.trim() || null,
        })
        .eq("id", containerId);

      if (updateError) {
        throw updateError;
      }

      // Если указано новое местоположение, создаем transition
      if (destinationType && selectedDestinationId) {
        const { error: transitionError } = await supabase.from("transitions").insert({
          container_id: containerId,
          destination_type: destinationType,
          destination_id: parseInt(selectedDestinationId),
        });

        if (transitionError) {
          console.error("Ошибка при создании transition:", transitionError);
        }
      }

      toast({
        title: "Контейнер обновлен",
        description: "Контейнер успешно обновлен",
      });

      // Небольшая задержка перед закрытием, чтобы toast успел отобразиться
      await new Promise(resolve => setTimeout(resolve, 200));

      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при редактировании контейнера"
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
    destinationType === "place" ? "место" :
    destinationType === "room" ? "помещение" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать контейнер</DialogTitle>
          <DialogDescription>Измените название или местоположение</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`container-name-${containerId}`}>Название контейнера</Label>
            <Input
              id={`container-name-${containerId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название контейнера"
              disabled={isSubmitting}
            />
          </div>

          {/* Выбор местоположения */}
          <div className="space-y-3 border-t pt-4">
            <div className="space-y-2">
              <Label>Изменить местоположение (необязательно)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={destinationType === "place" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDestinationType("place");
                    setSelectedDestinationId("");
                  }}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  <Container className="mr-2 h-4 w-4" />
                  Контейнер
                </Button>
                <Button
                  type="button"
                  variant={destinationType === "room" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDestinationType("room");
                    setSelectedDestinationId("");
                  }}
                  disabled={isSubmitting}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Помещение
                </Button>
                {destinationType && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDestinationType(null);
                      setSelectedDestinationId("");
                    }}
                    disabled={isSubmitting}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            {destinationType && (
              <div className="space-y-2">
                <Label htmlFor={`container-destination-select-${containerId}`}>
                  Выберите {destinationLabel}
                </Label>
                <Select
                  id={`container-destination-select-${containerId}`}
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
              </div>
            )}

            {currentLocation && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Текущее местоположение: {currentLocation.destination_name || `#${currentLocation.destination_id}`}
                </p>
              </div>
            )}
          </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditContainerForm;
