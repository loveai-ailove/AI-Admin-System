export type OptionItem = {
  value: number;
  label: string;
};

export type SidebarMenuItem = {
  id: number;
  parentId: number | null;
  name: string;
  path: string | null;
  type: "DIRECTORY" | "MENU";
  icon: string | null;
  orderNum: number;
  children: SidebarMenuItem[];
};
