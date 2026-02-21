"use client";

import { Field, FieldLabel, FieldSet } from "@/components/ui/field";
import { EntityFiltersShell } from "./entity-filters-shell";
import { YesNoAllFilter } from "./yes-no-all-filter";
import { LocationTypeSelect } from "@/components/fields/location-type-select";
import { RoomsSelect } from "@/components/fields/rooms-select";
import { BuildingsSelect } from "@/components/fields/buildings-select";
import { FurnitureSelect } from "@/components/fields/furniture-select";
import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import type { FilterFieldConfig, Filters } from "@/lib/app/types/entity-config";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";

export interface EntityFiltersPanelProps {
  fields: FilterFieldConfig[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function EntityFiltersPanel({
  fields,
  filters,
  onFiltersChange,
}: EntityFiltersPanelProps) {
  const showDeletedField = fields.find((f) => f.type === "showDeleted");
  const showDeletedLabel =
    showDeletedField?.type === "showDeleted"
      ? showDeletedField.label
      : "Показывать удалённые";

  const handleShowDeletedChange = (checked: boolean) => {
    onFiltersChange({ ...filters, showDeleted: checked });
  };

  const otherFields = fields.filter((f) => f.type !== "showDeleted");

  const fieldsContent = (
    <>
      {otherFields.map((field) => {
        if (field.type === "yesNoAll") {
          const value = (filters as Record<string, unknown>)[field.key] as
            | boolean
            | null
            | undefined;
          return (
            <YesNoAllFilter
              key={field.key}
              label={field.label}
              value={value ?? null}
              onChange={(v) =>
                onFiltersChange({
                  ...filters,
                  [field.key]: v,
                })
              }
            />
          );
        }
        if (field.type === "locationType") {
          const value = (filters as Record<string, unknown>)[field.key] as
            | "all"
            | "room"
            | "place"
            | "container"
            | null
            | undefined;
          return (
            <LocationTypeSelect
              key={field.key}
              value={value ?? null}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  [field.key]: v === "all" ? null : v,
                })
              }
            />
          );
        }
        if (field.type === "room") {
          const value = (filters as Record<string, unknown>)[field.key] as
            | number
            | null
            | undefined;
          return (
            <RoomsSelect
              key={field.key}
              value={value ?? null}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  [field.key]:
                    v === "all" || v == null ? null : parseInt(String(v), 10),
                })
              }
            />
          );
        }
        if (field.type === "building") {
          const value = (filters as Record<string, unknown>)[field.key] as
            | number
            | null
            | undefined;
          return (
            <BuildingsSelect
              key={field.key}
              value={value ?? null}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  [field.key]:
                    v === "all" || v == null ? null : parseInt(String(v), 10),
                })
              }
            />
          );
        }
        if (field.type === "furniture") {
          const value = (filters as Record<string, unknown>)[field.key] as
            | number
            | null
            | undefined;
          return (
            <FurnitureSelect
              key={field.key}
              value={value ?? null}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  [field.key]:
                    v === "all" || v == null ? null : parseInt(String(v), 10),
                })
              }
            />
          );
        }
        if (field.type === "entityType") {
          return (
            <EntityTypeFilterField
              key={field.key}
              entityKind={field.entityKind}
              value={(filters as Record<string, unknown>)[field.key] as
                | number
                | null
                | undefined}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  [field.key]:
                    v === "all" || v == null ? null : parseInt(String(v), 10),
                })
              }
              label={
                field.entityKind === "place"
                  ? "Тип места"
                  : field.entityKind === "furniture"
                    ? "Тип мебели"
                    : "Тип контейнера"
              }
            />
          );
        }
        return null;
      })}
    </>
  );

  return showDeletedField ? (
    <EntityFiltersShell
      showDeletedLabel={showDeletedLabel}
      showDeleted={filters.showDeleted}
      onShowDeletedChange={handleShowDeletedChange}
    >
      {fieldsContent}
    </EntityFiltersShell>
  ) : (
    <FieldSet>{fieldsContent}</FieldSet>
  );
}

interface EntityTypeFilterFieldProps {
  entityKind: "place" | "container" | "furniture";
  value: number | null | undefined;
  onValueChange: (value: string | null) => void;
  label: string;
}

function EntityTypeFilterField({
  entityKind,
  value,
  onValueChange,
  label,
}: EntityTypeFilterFieldProps) {
  const { options, isLoading } =
    useEntityTypeFilterOptions(entityKind);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <Combobox
          items={options}
          value={value != null ? value.toString() : "all"}
          onValueChange={(v) => onValueChange(v === "all" ? null : v)}
        />
      )}
    </Field>
  );
}
