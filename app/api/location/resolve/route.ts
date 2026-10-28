import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/auth";
import { cleanText } from "@/lib/server/validation";
import { fail, HttpError } from "@/lib/server/errors";
import type { Coordinates } from "@/lib/geo";

export const dynamic = "force-dynamic";

const cache = new Map<string, { location: Coordinates; expiresAt: number }>();
let lastLookupAt = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pin = cleanText(url.searchParams.get("pincode"), 12).replace(/\s/g, "");
    if (!/^[1-9]\d{5}$/.test(pin)) throw new HttpError(400, "Enter a valid 6-digit Indian PIN code.");

    const cached = cache.get(pin);
    if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.location);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    rateLimit(`location:${ip}`, 10, 60_000);
    const wait = Math.max(0, 1100 - (Date.now() - lastLookupAt));
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    lastLookupAt = Date.now();

    const endpoint = new URL("https://nominatim.openstreetmap.org/search");
    endpoint.searchParams.set("postalcode", pin);
    endpoint.searchParams.set("country", "India");
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("limit", "1");
    const response = await fetch(endpoint, {
      headers: { "User-Agent": "MediWay/1.0 location lookup" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) throw new HttpError(503, "PIN code lookup is temporarily unavailable. Try again or enter your area.");
    const results = await response.json() as { lat?: string; lon?: string; display_name?: string }[];
    const result = results[0];
    if (!result?.lat || !result.lon) throw new HttpError(404, "We couldn't find that PIN code. Check it and try again.");
    const location: Coordinates = {
      lat: Number(result.lat),
      lng: Number(result.lon),
      label: `${pin}${result.display_name ? `, ${result.display_name.split(",").slice(1, 3).join(",").trim()}` : ""}`,
    };
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      throw new HttpError(503, "The PIN code lookup returned an invalid location. Try again.");
    }
    cache.set(pin, { location, expiresAt: Date.now() + 24 * 60 * 60_000 });
    return NextResponse.json(location, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch (error) {
    return fail(error);
  }
}
