import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { parseId } from "@/lib/shared/api/parse-id";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import type { EntityTypeName } from "@/types/entity";

const ALLOWED_TABLES: readonly EntityTypeName[] = ["items", "places", "containers", "rooms", "buildings", "furniture"];

type DuplicateParams =
  | { params: Promise<{ table: string; id: string }> }
  | { params: { table: string; id: string } };

type SourceRow = {
  id: number;
  name: string | null;
  photo_url: string | null;
  deleted_at: string | null;
  item_type_id?: number | null;
  price_amount?: number | null;
  price_currency?: string | null;
  current_value_amount?: number | null;
  current_value_currency?: string | null;
  quantity?: number | null;
  purchase_date?: string | null;
  entity_type_id?: number | null;
  room_type_id?: number | null;
  building_type_id?: number | null;
  furniture_type_id?: number | null;
  building_id?: number | null;
  room_id?: number | null;
};

type LastTransitionRow = {
  destination_type: "room" | "place" | "container" | "furniture" | null;
  destination_id: number | null;
};

const SOURCE_SELECT_BY_TABLE: Record<EntityTypeName, string> = {
  items: "id, name, photo_url, item_type_id, price_amount, price_currency, current_value_amount, current_value_currency, quantity, purchase_date, deleted_at",
  places: "id, name, photo_url, entity_type_id, deleted_at",
  containers: "id, name, photo_url, entity_type_id, deleted_at",
  rooms: "id, name, photo_url, room_type_id, building_id, deleted_at",
  buildings: "id, name, photo_url, building_type_id, deleted_at",
  furniture: "id, name, photo_url, room_id, furniture_type_id, price_amount, price_currency, current_value_amount, current_value_currency, purchase_date, deleted_at",
};

const TRANSITION_ID_COLUMN_BY_TABLE: Partial<Record<EntityTypeName, "item_id" | "place_id" | "container_id">> = {
  items: "item_id",
  places: "place_id",
  containers: "container_id",
};

const getDuplicateName = (name: string | null): string | null => {
  const normalizedName = name?.trim();
  if (!normalizedName) return null;
  return `${normalizedName} (копия)`;
};

export async function POST(
  request: NextRequest,
  context: DuplicateParams
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(context.params);
    const table = resolvedParams.table as EntityTypeName;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Недопустимая таблица" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const idResult = parseId(resolvedParams.id, { entityLabel: "сущности" });
    if (idResult instanceof NextResponse) return idResult;
    const sourceId = idResult.id;

    const { data: sourceEntity, error: sourceError } = await supabase
      .from(table)
      .select(SOURCE_SELECT_BY_TABLE[table])
      .eq("id", sourceId)
      .maybeSingle();

    if (sourceError) {
      return NextResponse.json({ error: sourceError.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    if (!sourceEntity) {
      return NextResponse.json({ error: "Сущность не найдена" }, { status: HTTP_STATUS.NOT_FOUND });
    }

    const source = sourceEntity as unknown as SourceRow;
    if (source.deleted_at) {
      return NextResponse.json(
        { error: "Нельзя дублировать удаленную сущность" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const duplicateName = getDuplicateName(source.name);

    let insertData: Record<string, unknown> = {
      name: duplicateName,
      photo_url: source.photo_url || null,
      tenant_id: tenantId,
    };

    if (table === "items") {
      insertData = {
        ...insertData,
        item_type_id: source.item_type_id ?? null,
        price_amount: source.price_amount ?? null,
        price_currency: source.price_currency ?? null,
        current_value_amount: source.current_value_amount ?? null,
        current_value_currency: source.current_value_currency ?? null,
        quantity: source.quantity ?? 1,
        purchase_date: source.purchase_date ?? null,
      };
    } else if (table === "rooms") {
      insertData = {
        ...insertData,
        room_type_id: source.room_type_id ?? null,
        building_id: source.building_id ?? null,
      };
    } else if (table === "buildings") {
      insertData = {
        ...insertData,
        building_type_id: source.building_type_id ?? null,
      };
    } else if (table === "furniture") {
      insertData = {
        ...insertData,
        room_id: source.room_id ?? null,
        furniture_type_id: source.furniture_type_id ?? null,
        price_amount: source.price_amount ?? null,
        price_currency: source.price_currency ?? null,
        current_value_amount: source.current_value_amount ?? null,
        current_value_currency: source.current_value_currency ?? null,
        purchase_date: source.purchase_date ?? null,
      };
    } else {
      insertData = {
        ...insertData,
        entity_type_id: source.entity_type_id ?? null,
      };
    }

    const { data: duplicatedEntity, error: insertError } = await supabase
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (insertError || !duplicatedEntity) {
      return NextResponse.json(
        { error: insertError?.message || "Не удалось создать копию" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const transitionIdColumn = TRANSITION_ID_COLUMN_BY_TABLE[table];
    if (transitionIdColumn) {
      const { data: lastTransition, error: transitionLoadError } = await supabase
        .from("transitions")
        .select("destination_type, destination_id")
        .eq(transitionIdColumn, sourceId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (transitionLoadError) {
        await supabase.from(table).delete().eq("id", duplicatedEntity.id);
        return NextResponse.json({ error: transitionLoadError.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
      }

      const transition = lastTransition as LastTransitionRow | null;
      // Места могут быть только в мебели — пропускаем устаревшие room-переходы
      const skipTransition =
        table === "places" && transition?.destination_type === "room";
      if (transition?.destination_type && transition.destination_id && !skipTransition) {
        const { error: transitionInsertError } = await supabase
          .from("transitions")
          .insert({
            [transitionIdColumn]: duplicatedEntity.id,
            destination_type: transition.destination_type,
            destination_id: transition.destination_id,
            tenant_id: tenantId,
          });

        if (transitionInsertError) {
          await supabase.from(table).delete().eq("id", duplicatedEntity.id);
          return NextResponse.json({ error: transitionInsertError.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
        }
      }
    }

    return NextResponse.json(
      {
        data: duplicatedEntity,
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка дублирования сущности:",
      defaultMessage: "Произошла ошибка при дублировании сущности",
    });
  }
}
