import { Prisma, type PrismaClient } from "@/generated/prisma/client";

export type DeptDbClient = PrismaClient | Prisma.TransactionClient;

export async function resolveDeptAncestors(db: DeptDbClient, parentId?: number | null) {
  if (!parentId) {
    return "0";
  }

  const parent = await db.sysDept.findUnique({ where: { id: parentId } });
  if (!parent) {
    throw new Error("上级部门不存在");
  }

  return `${parent.ancestors},${parent.id}`;
}

export async function assertDeptMoveAllowed(db: DeptDbClient, deptId: number, parentId?: number | null) {
  if (!parentId) {
    return;
  }

  if (parentId === deptId) {
    throw new Error("上级部门不能选择自己");
  }

  const parent = await db.sysDept.findUnique({ where: { id: parentId } });
  if (!parent) {
    throw new Error("上级部门不存在");
  }

  const ancestorIds = parent.ancestors.split(",").filter(Boolean);
  if (ancestorIds.includes(String(deptId))) {
    throw new Error("不能将部门移动到自己的下级部门中");
  }
}

export async function cascadeDeptAncestors(
  db: DeptDbClient,
  params: {
    deptId: number;
    oldAncestors: string;
    newAncestors: string;
  }
) {
  const oldSelfPath = `${params.oldAncestors},${params.deptId}`;
  const newSelfPath = `${params.newAncestors},${params.deptId}`;

  const descendants = await db.sysDept.findMany({
    where: {
      ancestors: {
        startsWith: oldSelfPath,
      },
    },
    orderBy: { id: "asc" },
  });

  await Promise.all(
    descendants.map((dept) =>
      db.sysDept.update({
        where: { id: dept.id },
        data: {
          ancestors: dept.ancestors.replace(oldSelfPath, newSelfPath),
        },
      })
    )
  );
}
