"use client";
import { useEffect, useState } from "react";

/** Reads the URL query string on the client (avoids Suspense boundaries for static builds). */
export function useQuery() {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => setQ(new URLSearchParams(window.location.search)), []);
  return q;
}
