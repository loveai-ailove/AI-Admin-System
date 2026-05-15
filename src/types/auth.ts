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
  deptName: string | null;
  roleCodes: string[];
  permissions: string[];
  menus: CurrentUserMenu[];
};
