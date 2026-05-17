import { requireLogin } from "@/lib/auth/current-user";
import { getSidebarMenus } from "@/lib/auth/permission";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireLogin();
  const menus = getSidebarMenus(user);

  return (
    <AdminLayoutClient nickname={user.nickname} deptName={user.deptName} menus={menus}>
      {children}
    </AdminLayoutClient>
  );
}
