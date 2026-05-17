import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/auth/permission";
import { RoleManager } from "@/components/system/RoleManager";
import { buildLevelMap } from "@/lib/system/tree";

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
        dataScope: item.dataScope,
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
