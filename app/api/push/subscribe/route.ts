import { NextResponse } from "next/server";
import { getSession, assertSameOrigin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail, HttpError } from "@/lib/server/errors";
import { cleanText } from "@/lib/server/validation";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await getSession();
    if (!session) throw new HttpError(401, "Please log in to continue.");
    const body = await req.json();
    const endpoint = cleanText(body.endpoint, 2048);
    const keys = body.keys;
    if (!endpoint.startsWith("https://") || typeof keys?.p256dh !== "string" || typeof keys?.auth !== "string") {
      throw new HttpError(400, "Invalid push subscription.");
    }
    getDb().prepare(`INSERT INTO push_subscriptions(id,user_id,endpoint,keys_json,created_at)
      VALUES(?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,keys_json=excluded.keys_json`)
      .run(crypto.randomUUID(), session.id, endpoint, JSON.stringify({ keys: { p256dh: cleanText(keys.p256dh, 256), auth: cleanText(keys.auth, 128) } }), Date.now());
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
