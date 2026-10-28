import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/server/auth";
import { fail, HttpError } from "@/lib/server/errors";
import { tick } from "@/lib/server/service";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const secret = process.env.CRON_SECRET;
    const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const suppliedBytes = Buffer.from(supplied), secretBytes = Buffer.from(secret || "");
    if (!secret || suppliedBytes.length !== secretBytes.length || !timingSafeEqual(suppliedBytes, secretBytes)) {
      throw new HttpError(401, "Unauthorized.");
    }
    tick();
    return NextResponse.json({ ok: true });
  } catch (error) { return fail(error); }
}
