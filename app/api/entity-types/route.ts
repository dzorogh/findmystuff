import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("entity_types")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("entity_category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Произошла ошибка" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { entity_category, name } = body;

    if (!entity_category || !name) {
      return NextResponse.json(
        { error: "Необходимы поля: entity_category, name" },
        { status: 400 }
      );
    }

    if (!["place", "container", "room", "item", "building", "furniture"].includes(entity_category)) {
      return NextResponse.json(
        { error: "entity_category должен быть 'place', 'container', 'room', 'item', 'building' или 'furniture'" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("entity_types")
      .insert({ entity_category, name })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Произошла ошибка" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: "Необходим id" }, { status: 400 });
    }

    const updateData: { name?: string } = {};
    if (name !== undefined) updateData.name = name;

    const { data, error } = await supabase
      .from("entity_types")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Произошла ошибка" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Необходим id" }, { status: 400 });
    }

    const { error } = await supabase
      .from("entity_types")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Произошла ошибка" },
      { status: 500 }
    );
  }
}
