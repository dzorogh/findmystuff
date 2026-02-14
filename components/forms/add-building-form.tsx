"use client";

import { useState } from "react";
import { createBuilding } from "@/lib/buildings/api";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/forms/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityTypeSelect } from "../fields/entity-type-select";

interface AddBuildingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddBuildingForm = ({ open, onOpenChange, onSuccess }: AddBuildingFormProps) => {
  const { isLoading } = useUser();
  const { types: buildingTypes, isLoading: isLoadingTypes } = useEntityTypes("building");
  const [name, setName] = useState("");
  const [buildingTypeId, setBuildingTypeId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await createBuilding({
        name: name.trim() || undefined,
        building_type_id: buildingTypeId ? parseInt(buildingTypeId) : null,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setName("");
      setBuildingTypeId("");
      setPhotoUrl(null);

      toast.success("Здание успешно добавлено", {
        description: "Здание добавлено",
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при добавлении здания"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить новое здание</SheetTitle>
          <SheetDescription>
            Введите название здания
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="px-6">
          {isLoading || isLoadingTypes ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="building-name">Название здания</FieldLabel>
                <FieldDescription>
                  Поле необязательное. ID и дата создания заполнятся автоматически.
                </FieldDescription>
                <Input
                  id="building-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название здания"
                  disabled={isSubmitting}
                />
              </Field>

              <EntityTypeSelect
                type="building"
                value={buildingTypeId ? parseInt(buildingTypeId) : null}
                onValueChange={(v) => setBuildingTypeId(v ?? "")}
              />

              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={isSubmitting}
                label="Фотография здания (необязательно)"
              />

              <ErrorMessage message={error || ""} />

              <FormFooter
                isSubmitting={isSubmitting}
                onCancel={() => onOpenChange(false)}
                submitLabel="Добавить здание"
                submitIcon={Plus}
              />
            </FieldGroup>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddBuildingForm;
