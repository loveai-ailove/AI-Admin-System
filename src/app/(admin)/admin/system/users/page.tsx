import { prisma } from "@/lib/prisma";
import { hasPermission, requirePermission } from "@/lib/auth/permission";
import { SystemUserManager } from "@/components/system/SystemUserManager";
import { getLevelFromAncestors } from "@/lib/system/tree";

export default async function SystemUsersPage() {
  const user = await requirePermission("system:user:list");

  const [depts, roles] = await Promise.all([
    prisma.sysDept.findMany({ orderBy: [{ ancestors: "asc" }, { orderNum: "asc" }, { id: "asc" }] }),
    prisma.sysRole.findMany({ orderBy: [{ orderNum: "asc" }, { id: "asc" }] }),
  ]);

  return (
    <SystemUserManager
      depts={depts.map((item) => ({ id: item.id, parentId: item.parentId, name: item.name, level: getLevelFromAncestors(item.ancestors) }))}
      roles={roles.map((item) => ({ id: item.id, name: item.name, code: item.code }))}
      permissions={{
        create: hasPermission(user, "system:user:create"),
        update: hasPermission(user, "system:user:update"),
        delete: hasPermission(user, "system:user:delete"),
      }}
    />
  );
}
