"use client";

import { useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { SidebarMenuItem } from "@/types/system";

export function AdminLayoutClient({
  nickname,
  deptName,
  menus,
  children,
}: {
  nickname: string;
  deptName: string | null;
  menus: SidebarMenuItem[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebarCollapse = useCallback(() => setSidebarCollapsed((v) => !v), []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        menus={menus}
        open={sidebarOpen}
        onClose={closeSidebar}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          nickname={nickname}
          deptName={deptName}
          onOpenSidebar={openSidebar}
        />
        <main className="flex-1 p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
