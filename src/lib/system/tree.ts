import type { SidebarMenuItem } from "@/types/system";

type TreeLike = {
  id: number;
  parentId: number | null;
  orderNum?: number;
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
    nodes.sort((a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0) || a.id - b.id);
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

export function getLevelFromAncestors(ancestors: string): number {
  return ancestors
    .split(",")
    .filter((item) => item && item !== "0").length;
}

export function buildLevelMap(items: Array<{ id: number; parentId: number | null }>): Map<number, number> {
  const map = new Map<number, number>();

  function getLevel(id: number): number {
    if (map.has(id)) return map.get(id) || 0;
    const current = items.find((item) => item.id === id);
    if (!current || !current.parentId) {
      map.set(id, 0);
      return 0;
    }
    const level = getLevel(current.parentId) + 1;
    map.set(id, level);
    return level;
  }

  for (const item of items) {
    getLevel(item.id);
  }

  return map;
}

export function collectParentNodeIds<T extends { id: number; children: T[] }>(nodes: T[]): Set<number> {
  const ids = new Set<number>();
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.add(node.id);
      const childIds = collectParentNodeIds(node.children);
      for (const id of childIds) {
        ids.add(id);
      }
    }
  }
  return ids;
}
