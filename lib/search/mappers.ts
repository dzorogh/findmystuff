import type { EntityTypeName } from "@/types/entity";
import type {
  ItemSearchProjection,
  SearchBadge,
  SearchHit,
  SearchLocationLine,
} from "@/lib/search/types";

const ENTITY_LABELS: Record<EntityTypeName, string> = {
  item: "Вещь",
  place: "Место",
  container: "Контейнер",
  room: "Помещение",
  building: "Здание",
  furniture: "Мебель",
};

const ENTITY_ROUTES: Record<EntityTypeName, string> = {
  item: "/items",
  place: "/places",
  container: "/containers",
  room: "/rooms",
  building: "/buildings",
  furniture: "/furniture",
};

function buildHref(entityType: EntityTypeName, entityId: number): string {
  return `${ENTITY_ROUTES[entityType]}/${entityId}`;
}

function buildEntityBadge(entityType: EntityTypeName): SearchBadge {
  return {
    label: ENTITY_LABELS[entityType],
    variant: "secondary",
  };
}

function buildMatchBadges(
  match: ItemSearchProjection["search_match"] | null | undefined,
  options?: { semanticOnly?: boolean }
): SearchBadge[] {
  if (!match) {
    return [];
  }

  const sourceLabel =
    match.source === "image"
      ? "Совпадение по фото"
      : options?.semanticOnly
        ? "Семантическое совпадение"
        : "Умное совпадение";

  const badges: SearchBadge[] = [
    {
      label: sourceLabel,
      variant: "outline",
    },
  ];

  if (typeof match.similarity === "number") {
    badges.push({
      label: `Релевантность ${Math.round(match.similarity * 100)}%`,
      variant: "outline",
    });
  }

  return badges;
}

export function getEntityLabel(entityType: EntityTypeName): string {
  return ENTITY_LABELS[entityType];
}

export function getSearchHitLocationLines(input: {
  room_name?: string | null;
  furniture_name?: string | null;
  place_name?: string | null;
  container_name?: string | null;
}): SearchLocationLine[] {
  const lines: SearchLocationLine[] = [];

  if (input.room_name?.trim()) {
    lines.push({
      key: "room",
      label: "Помещение",
      value: input.room_name,
    });
  }

  if (input.furniture_name?.trim()) {
    lines.push({
      key: "furniture",
      label: "Мебель",
      value: input.furniture_name,
    });
  }

  if (input.place_name?.trim()) {
    lines.push({
      key: "place",
      label: "Место",
      value: input.place_name,
    });
  }

  if (input.container_name?.trim()) {
    lines.push({
      key: "container",
      label: "Контейнер",
      value: input.container_name,
    });
  }

  return lines;
}

export function mapItemProjectionToSearchHit(
  item: ItemSearchProjection,
  options?: { semanticOnly?: boolean }
): SearchHit {
  return {
    entityType: "item",
    entityId: item.id,
    title: item.name?.trim() || `Вещь #${item.id}`,
    subtitle: item.item_type_name?.trim() || null,
    href: buildHref("item", item.id),
    badges: [
      buildEntityBadge("item"),
      ...buildMatchBadges(item.search_match, options),
    ],
    locationLines: getSearchHitLocationLines(item),
    match: item.search_match
      ? {
          score: item.search_match.similarity,
          source: item.search_match.source,
        }
      : null,
    preview: item.photo_url
      ? {
          imageUrl: item.photo_url,
        }
      : null,
  };
}

export function mapNamedEntityToSearchHit(input: {
  entityType: Exclude<EntityTypeName, "item">;
  entityId: number;
  name: string | null;
}): SearchHit {
  return {
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.name?.trim() || `${getEntityLabel(input.entityType)} #${input.entityId}`,
    subtitle: null,
    href: buildHref(input.entityType, input.entityId),
    badges: [buildEntityBadge(input.entityType)],
    locationLines: [],
    match: null,
    preview: null,
  };
}
