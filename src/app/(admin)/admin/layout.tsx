import { requireLogin } from "@/lib/auth/current-user";
import { getSidebarMenus } from "@/lib/auth/permission";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireLogin();
  const menus = getSidebarMenus(user);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar menus={menus} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader nickname={user.nickname} deptName={user.deptName} />
        <main className="flex-1 p-5">{children}</main>
      </div>
    </div>
  );
}
