import { NextResponse } from "next/server";
import { assertSameOrigin, rateLimit, startSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fail } from "@/lib/server/errors";
import { newId } from "@/lib/server/service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    rateLimit(`guest:${req.headers.get("x-forwarded-for") || "local"}`, 20);
    const id = "g-" + newId();
    getDb().prepare("INSERT INTO users(id,role,name,is_guest,created_at) VALUES (?,?,?,1,?)").run(id, "patient", "Guest", Date.now());
    await startSession({ id, role: "patient" });
    return NextResponse.json({ ok: true });
  } catch (e) { return fail(e); }
}
