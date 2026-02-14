"use client";

import { useState, useEffect } from "react";
import { getBuilding, updateBuilding } from "@/lib/buildings/api";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
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
import { EntityTypeSelect } from "@/components/fields/entity-type-select";

interface EditBuildingFormProps {
  buildingId: number;
  buildingName: string | null;
  buildingTypeId?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditBuildingForm = ({
  buildingId,
  buildingName,
  buildingTypeId: initialBuildingTypeId,
  open,
  onOpenChange,
  onSuccess,
}: EditBuildingFormProps) => {
  const { isLoading } = useUser();
  const [name, setName] = useState(buildingName || "");
  const [buildingTypeId, setBuildingTypeId] = useState<string>(initialBuildingTypeId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && buildingId) {
      setName(buildingName || "");
      setBuildingTypeId(initialBuildingTypeId?.toString() || "");
      const loadBuilding = async () => {
        try {
          const response = await getBuilding(buildingId);
          const building = response.data?.building;
          if (building) {
            if (building.photo_url) setPhotoUrl(building.photo_url);
            else setPhotoUrl(null);
            if (building.building_type_id != null) setBuildingTypeId(building.building_type_id.toString());
          }
        } catch {
          setPhotoUrl(null);
        }
      };
      loadBuilding();
    } else {
      setName("");
      setBuildingTypeId("");
      setPhotoUrl(null);
    }
  }, [open, buildingId, buildingName, initialBuildingTypeId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await updateBuilding(buildingId, {
        name: name.trim() || undefined,
        building_type_id: buildingTypeId ? parseInt(buildingTypeId) : null,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Здание успешно обновлено");

      await new Promise((resolve) => setTimeout(resolve, 200));

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при редактировании здания"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать здание</SheetTitle>
          <SheetDescription>Измените название здания</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6">
          <FieldGroup>
            <EntityTypeSelect
              type="building"
              value={buildingTypeId ? parseInt(buildingTypeId) : null}
              onValueChange={(v) => setBuildingTypeId(v ?? "")}
            />

            <Field>
              <FieldLabel htmlFor={`building-name-${buildingId}`}>Название здания</FieldLabel>
              <Input
                id={`building-name-${buildingId}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название здания"
                disabled={isSubmitting}
              />
            </Field>

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
              submitLabel="Сохранить"
            />
          </FieldGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditBuildingForm;
