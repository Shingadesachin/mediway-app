import { StaffShell } from "@/components/staff/StaffShell";
import { StaffProvider } from "@/lib/staff-store";

export const metadata = { title: "MediWay for Clinics" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <StaffProvider><StaffShell>{children}</StaffShell></StaffProvider>;
}
