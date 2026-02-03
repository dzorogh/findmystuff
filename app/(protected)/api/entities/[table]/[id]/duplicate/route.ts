import { NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";

const ALLOWED_TABLES = ["items", "places", "containers", "rooms"] as const;
type TableName = (typeof ALLOWED_TABLES)[number];

type DuplicateParams =
  | { params: Promise<{ table: string; id: string }> }
  | { params: { table: string; id: string } };

type SourceRow = {
  id: number;
  name: string | null;
  photo_url: string | null;
  deleted_at: string | null;
  item_type_id?: number | null;
  entity_type_id?: number | null;
  room_type_id?: number | null;
};

type LastTransitionRow = {
  destination_type: "room" | "place" | "container" | null;
  destination_id: number | null;
};

const SOURCE_SELECT_BY_TABLE: Record<TableName, string> = {
  items: "id, name, photo_url, item_type_id, deleted_at",
  places: "id, name, photo_url, entity_type_id, deleted_at",
  containers: "id, name, photo_url, entity_type_id, deleted_at",
  rooms: "id, name, photo_url, room_type_id, deleted_at",
};

const TRANSITION_ID_COLUMN_BY_TABLE: Partial<Record<TableName, "item_id" | "place_id" | "container_id">> = {
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
  _: Request,
  context: DuplicateParams
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const table = resolvedParams.table as TableName;
    const sourceId = Number.parseInt(resolvedParams.id, 10);

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Недопустимая таблица" }, { status: 400 });
    }

    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      return NextResponse.json({ error: "Неверный ID" }, { status: 400 });
    }

    const { data: sourceEntity, error: sourceError } = await supabase
      .from(table)
      .select(SOURCE_SELECT_BY_TABLE[table])
      .eq("id", sourceId)
      .maybeSingle();

    if (sourceError) {
      return NextResponse.json({ error: sourceError.message }, { status: 500 });
    }

    if (!sourceEntity) {
      return NextResponse.json({ error: "Сущность не найдена" }, { status: 404 });
    }

    const source = sourceEntity as SourceRow;
    if (source.deleted_at) {
      return NextResponse.json(
        { error: "Нельзя дублировать удаленную сущность" },
        { status: 400 }
      );
    }

    const duplicateName = getDuplicateName(source.name);

    let insertData: Record<string, unknown> = {
      name: duplicateName,
      photo_url: source.photo_url || null,
    };

    if (table === "items") {
      insertData = {
        ...insertData,
        item_type_id: source.item_type_id ?? null,
      };
    } else if (table === "rooms") {
      insertData = {
        ...insertData,
        room_type_id: source.room_type_id ?? null,
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
        { status: 500 }
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
        return NextResponse.json({ error: transitionLoadError.message }, { status: 500 });
      }

      const transition = lastTransition as LastTransitionRow | null;
      if (transition?.destination_type && transition.destination_id) {
        const { error: transitionInsertError } = await supabase
          .from("transitions")
          .insert({
            [transitionIdColumn]: duplicatedEntity.id,
            destination_type: transition.destination_type,
            destination_id: transition.destination_id,
          });

        if (transitionInsertError) {
          await supabase.from(table).delete().eq("id", duplicatedEntity.id);
          return NextResponse.json({ error: transitionInsertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json(
      {
        data: duplicatedEntity,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка дублирования сущности:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при дублировании сущности",
      },
      { status: 500 }
    );
  }
}
