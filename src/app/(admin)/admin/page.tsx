import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permission";

export default async function AdminDashboardPage() {
  await requirePermission("system:dashboard:view");

  const [userCount, roleCount, menuCount, deptCount] = await Promise.all([
    prisma.sysUser.count(),
    prisma.sysRole.count(),
    prisma.sysMenu.count(),
    prisma.sysDept.count(),
  ]);

  const cards = [
    { title: "系统用户", value: userCount },
    { title: "角色数量", value: roleCount },
    { title: "菜单数量", value: menuCount },
    { title: "部门数量", value: deptCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="text-sm text-gray-500">{card.title}</div>
            <div className="mt-3 text-3xl font-semibold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
