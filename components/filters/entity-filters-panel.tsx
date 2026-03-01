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
import type { FilterFieldConfig, Filters } from "@/types/entity";
import { useEntityTypeFilterOptions } from "@/lib/entities/hooks/use-entity-type-filter-options";

/** Filter field config that has a key (excludes showDeleted). */
type FilterFieldWithKey = Exclude<FilterFieldConfig, { type: "showDeleted" }>;

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

  const otherFields = fields.filter(
    (f): f is FilterFieldWithKey => f.type !== "showDeleted"
  );

  const renderFilterField = (field: FilterFieldWithKey) => {
    const value = (filters as Record<string, unknown>)[field.key];
    const setFilterValue = (v: string | number | boolean | null) =>
      onFiltersChange({
        ...filters,
        [field.key]: v === "all" || v == null ? null : v,
      });
    const setNumericValue = (v: string | null) =>
      onFiltersChange({
        ...filters,
        [field.key]:
          v === "all" || v == null ? null : parseInt(String(v), 10),
      });

    switch (field.type) {
      case "yesNoAll":
        return (
          <YesNoAllFilter
            key={field.key}
            label={field.label}
            value={(value as boolean | null | undefined) ?? null}
            onChange={(v) => onFiltersChange({ ...filters, [field.key]: v })}
          />
        );
      case "locationType":
        return (
          <LocationTypeSelect
            key={field.key}
            value={(value as "all" | "room" | "place" | "container" | null | undefined) ?? null}
            onValueChange={(v) => setFilterValue(v === "all" ? null : v)}
          />
        );
      case "room":
        return (
          <RoomsSelect
            key={field.key}
            value={(value as number | null | undefined) ?? null}
            onValueChange={setNumericValue}
          />
        );
      case "building":
        return (
          <BuildingsSelect
            key={field.key}
            value={(value as number | null | undefined) ?? null}
            onValueChange={setNumericValue}
          />
        );
      case "furniture":
        return (
          <FurnitureSelect
            key={field.key}
            value={(value as number | null | undefined) ?? null}
            onValueChange={setNumericValue}
          />
        );
      case "entityType":
        return (
          <EntityTypeFilterField
            key={field.key}
            entityKind={field.entityKind}
            value={(value as number | null | undefined) ?? null}
            onValueChange={setNumericValue}
            label={
              field.entityKind === "place"
                ? "Тип места"
                : field.entityKind === "furniture"
                  ? "Тип мебели"
                  : "Тип контейнера"
            }
          />
        );
      default:
        return null;
    }
  };

  const fieldsContent = (
    <>{otherFields.map((field) => renderFilterField(field))}</>
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
