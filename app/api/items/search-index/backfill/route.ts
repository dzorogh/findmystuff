import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { backfillItemSearchDocuments } from "@/lib/entities/items/search-index-server";

const MAX_BACKFILL_LIMIT = 100;

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;

    const supabase = await createClient();
    const body = await request.json().catch(() => ({}));
    const limitValue = Number(body?.limit);
    const afterIdValue = Number(body?.afterId);

    const limit = Number.isFinite(limitValue)
      ? Math.min(Math.max(Math.trunc(limitValue), 1), MAX_BACKFILL_LIMIT)
      : 20;
    const afterId = Number.isFinite(afterIdValue)
      ? Math.max(Math.trunc(afterIdValue), 0)
      : 0;

    const result = await backfillItemSearchDocuments(supabase, auth.tenantId, {
      limit,
      afterId,
    });

    return NextResponse.json({
      processed: result.processed,
      nextAfterId: result.nextAfterId,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось выполнить backfill поискового индекса";
    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json(
        { error: message },
        { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
      );
    }

    return apiErrorResponse(error, {
      defaultMessage: message,
    });
  }
}
