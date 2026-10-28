import { StaffShell } from "@/components/staff/StaffShell";
import { StaffProvider } from "@/lib/staff-store";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <StaffProvider><StaffShell>{children}</StaffShell></StaffProvider>;
}
