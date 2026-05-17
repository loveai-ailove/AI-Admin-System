import { DataScopeType, MenuType, Status, type PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

async function createDefaultMenus(tx: PrismaClient) {
  const dashboard = await tx.sysMenu.create({
    data: {
      name: "工作台",
      type: MenuType.MENU,
      path: "/admin",
      component: "admin/page",
      perms: "system:dashboard:view",
      icon: "layout-dashboard",
      orderNum: 0,
      status: Status.ACTIVE,
    },
  });

  const systemRoot = await tx.sysMenu.create({
    data: {
      name: "系统管理",
      type: MenuType.DIRECTORY,
      path: "/admin/system",
      component: "admin/system",
      icon: "settings",
      orderNum: 1,
      status: Status.ACTIVE,
    },
  });

  const userMenu = await tx.sysMenu.create({
    data: {
      parentId: systemRoot.id,
      name: "用户管理",
      type: MenuType.MENU,
      path: "/admin/system/users",
      component: "admin/system/users/page",
      perms: "system:user:list",
      orderNum: 1,
      status: Status.ACTIVE,
    },
  });

  const roleMenu = await tx.sysMenu.create({
    data: {
      parentId: systemRoot.id,
      name: "角色管理",
      type: MenuType.MENU,
      path: "/admin/system/roles",
      component: "admin/system/roles/page",
      perms: "system:role:list",
      orderNum: 2,
      status: Status.ACTIVE,
    },
  });

  const menuMenu = await tx.sysMenu.create({
    data: {
      parentId: systemRoot.id,
      name: "菜单管理",
      type: MenuType.MENU,
      path: "/admin/system/menus",
      component: "admin/system/menus/page",
      perms: "system:menu:list",
      orderNum: 3,
      status: Status.ACTIVE,
    },
  });

  const deptMenu = await tx.sysMenu.create({
    data: {
      parentId: systemRoot.id,
      name: "部门管理",
      type: MenuType.MENU,
      path: "/admin/system/depts",
      component: "admin/system/depts/page",
      perms: "system:dept:list",
      orderNum: 4,
      status: Status.ACTIVE,
    },
  });

  const logRoot = await tx.sysMenu.create({
    data: {
      name: "日志管理",
      type: MenuType.DIRECTORY,
      path: "/admin/logs",
      component: "admin/logs",
      icon: "file-text",
      orderNum: 2,
      status: Status.ACTIVE,
    },
  });

  const operLogMenu = await tx.sysMenu.create({
    data: {
      parentId: logRoot.id,
      name: "操作日志",
      type: MenuType.MENU,
      path: "/admin/logs/oper",
      component: "admin/logs/oper/page",
      perms: "log:oper:list",
      orderNum: 1,
      status: Status.ACTIVE,
    },
  });

  const loginLogMenu = await tx.sysMenu.create({
    data: {
      parentId: logRoot.id,
      name: "登录日志",
      type: MenuType.MENU,
      path: "/admin/logs/login",
      component: "admin/logs/login/page",
      perms: "log:login:list",
      orderNum: 2,
      status: Status.ACTIVE,
    },
  });

  const buttonConfigs = [
    [userMenu.id, "用户新增", "system:user:create"],
    [userMenu.id, "用户修改", "system:user:update"],
    [userMenu.id, "用户删除", "system:user:delete"],
    [roleMenu.id, "角色新增", "system:role:create"],
    [roleMenu.id, "角色修改", "system:role:update"],
    [roleMenu.id, "角色删除", "system:role:delete"],
    [menuMenu.id, "菜单新增", "system:menu:create"],
    [menuMenu.id, "菜单修改", "system:menu:update"],
    [menuMenu.id, "菜单删除", "system:menu:delete"],
    [deptMenu.id, "部门新增", "system:dept:create"],
    [deptMenu.id, "部门修改", "system:dept:update"],
    [deptMenu.id, "部门删除", "system:dept:delete"],
    [operLogMenu.id, "操作日志删除", "log:oper:delete"],
    [operLogMenu.id, "操作日志导出", "log:oper:export"],
    [loginLogMenu.id, "登录日志删除", "log:login:delete"],
    [loginLogMenu.id, "登录日志导出", "log:login:export"],
  ] as const;

  const buttonMenus = [] as number[];

  for (const [parentId, name, perms] of buttonConfigs) {
    const button = await tx.sysMenu.create({
      data: {
        parentId,
        name,
        type: MenuType.BUTTON,
        perms,
        orderNum: 99,
        visible: false,
        status: Status.ACTIVE,
      },
    });

    buttonMenus.push(button.id);
  }

  return [dashboard.id, systemRoot.id, userMenu.id, roleMenu.id, menuMenu.id, deptMenu.id, logRoot.id, operLogMenu.id, loginLogMenu.id, ...buttonMenus];
}

export async function bootstrapSystem() {
  const count = await prisma.sysUser.count();

  if (count > 0) {
    throw new Error("CONFLICT");
  }

  const passwordHash = await hashPassword("Admin123!");

  return prisma.$transaction(async (tx) => {
    const rootDept = await tx.sysDept.create({
      data: {
        name: "总部",
        ancestors: "0",
        orderNum: 0,
        status: Status.ACTIVE,
        leader: "系统管理员",
      },
    });

    const menuIds = await createDefaultMenus(tx as unknown as PrismaClient);

    const adminRole = await tx.sysRole.create({
      data: {
        name: "超级管理员",
        code: "admin",
        orderNum: 0,
        dataScope: DataScopeType.ALL,
        status: Status.ACTIVE,
        remark: "拥有系统全部权限",
      },
    });

    await tx.sysRoleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId: adminRole.id, menuId })),
    });

    const adminUser = await tx.sysUser.create({
      data: {
        username: "admin",
        nickname: "超级管理员",
        passwordHash,
        deptId: rootDept.id,
        status: Status.ACTIVE,
        isAdmin: true,
        remark: "系统初始化账号",
      },
    });

    await tx.sysUserRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    return {
      username: "admin",
      password: "Admin123!",
      deptName: rootDept.name,
      roleName: adminRole.name,
    };
  });
}
