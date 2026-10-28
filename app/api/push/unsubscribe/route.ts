import { NextResponse } from "next/server";
import { assertSameOrigin, getSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Please log in to continue.");
    const { endpoint } = await req.json();
    getDb().prepare("DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?").run(cleanText(endpoint, 2048), session.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
