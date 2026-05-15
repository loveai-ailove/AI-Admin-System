import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/auth/permission";
import { RoleManager } from "@/components/system/RoleManager";

function buildLevelMap(items: Array<{ id: number; parentId: number | null }>) {
  const map = new Map<number, number>();

  function getLevel(id: number): number {
    if (map.has(id)) return map.get(id) || 0;
    const current = items.find((item) => item.id === id);
    if (!current || !current.parentId) {
      map.set(id, 0);
      return 0;
    }
    const level = getLevel(current.parentId) + 1;
    map.set(id, level);
    return level;
  }

  for (const item of items) {
    getLevel(item.id);
  }

  return map;
}

export default async function SystemRolesPage() {
  const user = await requirePermission("system:role:list");

  const [roles, menus] = await Promise.all([
    prisma.sysRole.findMany({
      include: { menus: true },
      orderBy: [{ orderNum: "asc" }, { id: "asc" }],
    }),
    prisma.sysMenu.findMany({ orderBy: [{ orderNum: "asc" }, { id: "asc" }] }),
  ]);

  const levelMap = buildLevelMap(menus.map((item) => ({ id: item.id, parentId: item.parentId })));

  return (
    <RoleManager
      roles={roles.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        orderNum: item.orderNum,
        status: item.status,
        remark: item.remark,
        menuIds: item.menus.map((menu) => menu.menuId),
        createdAt: item.createdAt.toLocaleDateString("zh-CN"),
      }))}
      menus={menus.map((item) => ({
        id: item.id,
        parentId: item.parentId,
        name: item.name,
        level: levelMap.get(item.id) || 0,
        type: item.type,
        orderNum: item.orderNum,
        perms: item.perms,
      }))}
      permissions={{
        create: hasPermission(user, "system:role:create"),
        update: hasPermission(user, "system:role:update"),
        delete: hasPermission(user, "system:role:delete"),
      }}
    />
  );
}
