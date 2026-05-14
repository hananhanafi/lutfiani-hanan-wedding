import { getAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import SessionProvider from "@/components/SessionProvider";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <SessionProvider session={session}>
      <AdminLayout>{children}</AdminLayout>
    </SessionProvider>
  );
}
