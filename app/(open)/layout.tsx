import { Shell } from "@/components/Shell";
// Emergency and first aid stay reachable without logging in.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
