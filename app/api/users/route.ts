import { NextRequest, NextResponse } from "next/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import { getSupabaseAdmin } from "@/lib/shared/supabase/admin";
import { createClient as createServerClient } from "@/lib/shared/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getActiveTenantId(request.headers);
    if (!tenantId) {
      return NextResponse.json(
        { error: "Выберите тенант или создайте склад" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: memberships, error: membersError } = await supabase
      .from("tenant_memberships")
      .select("user_id")
      .eq("tenant_id", tenantId);

    if (membersError) {
      console.error("Error fetching tenant members:", membersError);
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    const memberUserIds = new Set(
      (memberships ?? []).map((m: { user_id: string }) => m.user_id)
    );

    if (memberUserIds.size === 0) {
      return NextResponse.json({ users: [] });
    }

    const { data: { users }, error } = await getSupabaseAdmin().auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const filteredUsers = (users ?? []).filter((u) => memberUserIds.has(u.id));
    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function generatePassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (x) => charset[x % charset.length]).join("");
}

async function findUserByEmail(admin: ReturnType<typeof getSupabaseAdmin>, email: string) {
  const normalised = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const user = (data.users ?? []).find(
      (u) => u.email?.toLowerCase() === normalised
    );
    if (user) return user;
    if ((data.users ?? []).length < perPage) return null;
    page++;
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getActiveTenantId(request.headers);
    if (!tenantId) {
      return NextResponse.json(
        { error: "Выберите тенант или создайте склад" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, email_confirm } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email обязателен" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const addToTenant = async (userId: string) => {
      const supabase = await createServerClient();
      const { error } = await supabase.from("tenant_memberships").insert({
        tenant_id: tenantId,
        user_id: userId,
        role: "member",
      });
      if (error) {
        if (error.code === "23505") {
          return { alreadyMember: true };
        }
        throw new Error(error.message);
      }
      return { alreadyMember: false };
    };

    const password = generatePassword(12);
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: email_confirm !== undefined ? email_confirm : true,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes("already registered") ||
        msg.includes("already been registered") ||
        msg.includes("already exists")
      ) {
        const existingUser = await findUserByEmail(admin, email);
        if (!existingUser) {
          return NextResponse.json(
            { error: "Пользователь с этим email зарегистрирован, но не найден. Обратитесь в поддержку." },
            { status: 500 }
          );
        }
        const result = await addToTenant(existingUser.id);
        if (result.alreadyMember) {
          return NextResponse.json(
            { error: "Пользователь уже добавлен в этот склад" },
            { status: 400 }
          );
        }
        return NextResponse.json({
          user: existingUser,
          invited: true,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Ошибка создания пользователя" }, { status: 500 });
    }

    const result = await addToTenant(data.user.id);
    if (result.alreadyMember) {
      return NextResponse.json({ user: data.user, password });
    }

    return NextResponse.json({ user: data.user, password });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const password = generatePassword(12);

    const { data, error } = await getSupabaseAdmin().auth.admin.updateUserById(id, {
      email,
      password,
    });

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data.user, password });
  } catch (error) {
    console.error("Error in PUT /api/users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { error } = await getSupabaseAdmin().auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
