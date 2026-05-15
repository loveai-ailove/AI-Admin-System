import { cache } from "react";
import { redirect } from "next/navigation";
import { Status } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionToken } from "@/lib/auth/session";
import type { CurrentUser } from "@/types/auth";

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const session = await prisma.sysUserSession.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          dept: true,
          roles: {
            include: {
              role: {
                include: {
                  menus: {
                    include: {
                      menu: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.sysUserSession.deleteMany({ where: { token } });
    return null;
  }

  if (session.user.status === Status.DISABLED) {
    await prisma.sysUserSession.deleteMany({ where: { token } });
    return null;
  }

  const activeRoles = session.user.roles
    .map((item) => item.role)
    .filter((role) => role.status === Status.ACTIVE);

  const permissions = new Set<string>();
  const menuMap = new Map<number, CurrentUser["menus"][number]>();

  for (const role of activeRoles) {
    for (const roleMenu of role.menus) {
      const { menu } = roleMenu;
      if (menu.status !== Status.ACTIVE) continue;

      if (menu.perms) {
        permissions.add(menu.perms);
      }

      menuMap.set(menu.id, {
        id: menu.id,
        parentId: menu.parentId ?? null,
        name: menu.name,
        path: menu.path ?? null,
        type: menu.type,
        perms: menu.perms ?? null,
        icon: menu.icon ?? null,
        orderNum: menu.orderNum,
        visible: menu.visible,
      });
    }
  }

  return {
    id: session.user.id,
    username: session.user.username,
    nickname: session.user.nickname,
    isAdmin: session.user.isAdmin,
    deptName: session.user.dept?.name ?? null,
    roleCodes: activeRoles.map((role) => role.code),
    permissions: Array.from(permissions),
    menus: Array.from(menuMap.values()),
  };
});

export async function requireLogin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireGuest() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }
}
