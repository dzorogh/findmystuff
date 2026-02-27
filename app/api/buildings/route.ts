import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { getBuildingsWithCountsRpc } from "@/lib/buildings/api";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { DEFAULT_PAGE_LIMIT } from "@/lib/shared/api/constants";
import type { Building } from "@/types/entity";

/**
 * Handle GET requests to list buildings with counts, supporting search, deleted visibility, and sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: buildingsData, error: fetchError } = await getBuildingsWithCountsRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: DEFAULT_PAGE_LIMIT,
      page_offset: 0,
      sort_by: sortBy,
      sort_direction: sortDirection,
      filter_tenant_id: tenantId,
    });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    type BuildingRow = {
      id: number;
      name: string | null;
      building_type_id: number | null;
      building_type_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      rooms_count: number;
      total_count?: number;
    };

    if (!buildingsData || buildingsData.length === 0) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
    }

    const rows = buildingsData as BuildingRow[];
    const totalCount =
      rows[0]?.total_count != null ? Number(rows[0].total_count) : rows.length;

    const buildings: Building[] = rows.map((b) => ({
      id: b.id,
      name: b.name,
      building_type_id: b.building_type_id ?? null,
      building_type: b.building_type_name ? { name: b.building_type_name } : null,
      created_at: b.created_at,
      deleted_at: b.deleted_at,
      photo_url: b.photo_url,
      rooms_count: b.rooms_count ?? 0,
    }));

    return NextResponse.json({
      data: buildings,
      totalCount,
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки списка зданий:",
      defaultMessage: "Произошла ошибка при загрузке данных",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();

    const body = await request.json();
    const { name, photo_url, building_type_id } = body;

    const insertData: {
      name: string | null;
      photo_url: string | null;
      building_type_id: number | null;
      tenant_id: number;
    } = {
      name: name?.trim() || null,
      photo_url: photo_url || null,
      building_type_id: building_type_id != null ? (Number(building_type_id) || null) : null,
      tenant_id: tenantId,
    };

    const { data: newBuilding, error: insertError } = await supabase
      .from("buildings")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newBuilding });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка создания здания:",
      defaultMessage: "Произошла ошибка при создании здания",
    });
  }
}
