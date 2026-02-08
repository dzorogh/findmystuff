import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { getContainersWithLocationRpc } from "@/lib/containers/api";
import { getServerUser } from "@/lib/users/server";
import type { Container } from "@/types/entity";

/**
 * Retrieve a list of containers with optional search, deleted filtering, sorting, and last-location data.
 *
 * Requires an authenticated user; responds with a 401 JSON error if the request is unauthenticated.
 *
 * @returns `{ data: Container[] }` on success, or `{ error: string }` with an appropriate HTTP status on failure.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: containersData, error: fetchError } = await getContainersWithLocationRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: 2000,
      page_offset: 0,
      sort_by: sortBy,
      sort_direction: sortDirection,
    });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!containersData || containersData.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    const containers: Container[] = containersData.map((container: {
      id: number;
      name: string | null;
      entity_type_id: number | null;
      entity_type_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      items_count: number;
      destination_type: string | null;
      destination_id: number | null;
      destination_name: string | null;
      moved_at: string | null;
    }) => ({
      id: container.id,
      name: container.name,
      entity_type_id: container.entity_type_id || null,
      entity_type: container.entity_type_name
        ? { name: container.entity_type_name }
        : null,
      created_at: container.created_at,
      deleted_at: container.deleted_at,
      photo_url: container.photo_url,
      itemsCount: container.items_count ?? 0,
      last_location: container.destination_type
        ? {
            destination_type: container.destination_type,
            destination_id: container.destination_id,
            destination_name: container.destination_name,
            moved_at: container.moved_at,
          }
        : null,
    }));

    return NextResponse.json({
      data: containers,
    });
  } catch (error) {
    console.error("Ошибка загрузки списка контейнеров:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при загрузке данных",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const supabase = await createClient();
    const body = await request.json();
    const { name, entity_type_id, photo_url, destination_type, destination_id } = body;

    const insertData: {
      name: string | null;
      entity_type_id: number | null;
      photo_url: string | null;
    } = {
      name: name?.trim() || null,
      entity_type_id: entity_type_id || null,
      photo_url: photo_url || null,
    };

    const { data: newContainer, error: insertError } = await supabase
      .from("containers")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Если указано местоположение, создаем transition
    if (destination_type && destination_id && newContainer) {
      const { error: transitionError } = await supabase
        .from("transitions")
        .insert({
          container_id: newContainer.id,
          destination_type,
          destination_id: parseInt(destination_id),
        });

      if (transitionError) {
        // Удаляем созданный контейнер, если не удалось создать transition
        await supabase.from("containers").delete().eq("id", newContainer.id);
        return NextResponse.json(
          { error: transitionError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data: newContainer });
  } catch (error) {
    console.error("Ошибка создания контейнера:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании контейнера",
      },
      { status: 500 }
    );
  }
}