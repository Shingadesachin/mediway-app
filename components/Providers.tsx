"use client";
import { usePathname } from "next/navigation";
import { AppProvider } from "@/lib/store";

/** The clinic staff app has its own state and never loads the patient provider. */
export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/staff")) return <>{children}</>;
  return <AppProvider>{children}</AppProvider>;
}
