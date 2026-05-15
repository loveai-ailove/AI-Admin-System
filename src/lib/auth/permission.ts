import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/auth/current-user";
import { buildSidebarTree } from "@/lib/system/tree";
import type { CurrentUser } from "@/types/auth";
import type { SidebarMenuItem } from "@/types/system";

export function hasPermission(user: CurrentUser, permission: string) {
  return user.isAdmin || user.permissions.includes(permission);
}

export async function requirePermission(permission: string) {
  const user = await requireLogin();

  if (!hasPermission(user, permission)) {
    redirect("/admin");
  }

  return user;
}

export function assertPermission(user: CurrentUser, permission: string) {
  if (!hasPermission(user, permission)) {
    throw new Error("FORBIDDEN");
  }
}

export function getSidebarMenus(user: CurrentUser) {
  const menus: Array<Omit<SidebarMenuItem, "children">> = user.menus
    .filter((menu) => menu.type !== "BUTTON" && menu.visible && menu.path)
    .map((menu) => ({
      id: menu.id,
      parentId: menu.parentId,
      name: menu.name,
      path: menu.path,
      type: menu.type === "DIRECTORY" ? "DIRECTORY" : "MENU",
      icon: menu.icon,
      orderNum: menu.orderNum,
    }));

  return buildSidebarTree(menus);
}
