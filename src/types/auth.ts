import type { DataScopeType } from "@/generated/prisma/client";

export type CurrentUserMenu = {
  id: number;
  parentId: number | null;
  name: string;
  path: string | null;
  type: "DIRECTORY" | "MENU" | "BUTTON";
  perms: string | null;
  icon: string | null;
  orderNum: number;
  visible: boolean;
};

export type CurrentUser = {
  id: number;
  username: string;
  nickname: string;
  isAdmin: boolean;
  deptId: number | null;
  deptName: string | null;
  dataScopeType: DataScopeType;
  roleCodes: string[];
  permissions: string[];
  menus: CurrentUserMenu[];
  allowedDeptIds: number[] | null;
};
