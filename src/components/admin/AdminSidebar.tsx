"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarMenuItem } from "@/types/system";

function SidebarNode({ item, pathname }: { item: SidebarMenuItem; pathname: string }) {
  const isActive = item.path ? pathname === item.path || pathname.startsWith(`${item.path}/`) : false;

  return (
    <div className="space-y-1">
      {item.path ? (
        <Link
          href={item.path}
          className={`block rounded-lg px-3 py-2 text-sm transition ${
            isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {item.name}
        </Link>
      ) : (
        <div className="px-3 py-2 text-sm font-medium text-gray-500">{item.name}</div>
      )}

      {item.children.length > 0 ? (
        <div className="space-y-1 border-l border-gray-200 pl-3">
          {item.children.map((child) => (
            <SidebarNode key={child.id} item={child} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminSidebar({ menus }: { menus: SidebarMenuItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white lg:block">
      <div className="border-b border-gray-200 px-6 py-5">
        <Link href="/admin" className="text-lg font-semibold text-gray-900">
          Admin System
        </Link>
      </div>
      <div className="space-y-2 p-4">
        {menus.map((menu) => (
          <SidebarNode key={menu.id} item={menu} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}
