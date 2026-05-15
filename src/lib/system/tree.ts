import type { SidebarMenuItem } from "@/types/system";

type TreeLike = {
  id: number;
  parentId: number | null;
  orderNum: number;
};

export function buildTree<T extends TreeLike>(items: T[]): Array<T & { children: Array<T & { children: never[] }> }> {
  const map = new Map<number, T & { children: Array<T & { children: never[] }> }>();
  const roots: Array<T & { children: Array<T & { children: never[] }> }> = [];

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)?.children.push(item as T & { children: never[] });
    } else {
      roots.push(item);
    }
  }

  const sortTree = (nodes: Array<T & { children: Array<T & { children: never[] }> }>) => {
    nodes.sort((a, b) => a.orderNum - b.orderNum || a.id - b.id);
    for (const node of nodes) {
      sortTree(node.children);
    }
  };

  sortTree(roots);
  return roots;
}

export function buildSidebarTree(items: Omit<SidebarMenuItem, "children">[]): SidebarMenuItem[] {
  return buildTree(items) as SidebarMenuItem[];
}
