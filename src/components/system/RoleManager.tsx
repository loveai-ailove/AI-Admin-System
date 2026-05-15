"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

type RoleRecord = {
  id: number;
  name: string;
  code: string;
  orderNum: number;
  status: "ACTIVE" | "DISABLED";
  remark: string | null;
  menuIds: number[];
  createdAt: string;
};

type MenuOption = {
  id: number;
  parentId: number | null;
  name: string;
  level: number;
  type: "DIRECTORY" | "MENU" | "BUTTON";
  orderNum: number;
  perms?: string | null;
};

type RoleFormState = {
  name: string;
  code: string;
  orderNum: number;
  status: "ACTIVE" | "DISABLED";
  remark: string;
  menuIds: number[];
};

const emptyForm: RoleFormState = {
  name: "",
  code: "",
  orderNum: 0,
  status: "ACTIVE",
  remark: "",
  menuIds: [],
};

function MenuCheckbox({
  checked,
  indeterminate,
}: {
  checked: boolean;
  indeterminate: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return <input ref={inputRef} type="checkbox" checked={checked} readOnly className="pointer-events-none" />;
}

export function RoleManager({
  roles,
  menus,
  permissions,
}: {
  roles: RoleRecord[];
  menus: MenuOption[];
  permissions: { create: boolean; update: boolean; delete: boolean };
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menuKeyword, setMenuKeyword] = useState("");
  const [listKeyword, setListKeyword] = useState("");
  const [listStatusFilter, setListStatusFilter] = useState<"ALL" | RoleRecord["status"]>("ALL");
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const menuMap = useMemo(() => new Map(menus.map((menu) => [menu.id, menu])), [menus]);
  const selectedSet = useMemo(() => new Set(form.menuIds), [form.menuIds]);
  const keyword = menuKeyword.trim().toLowerCase();
  const menuHasFilters = Boolean(keyword) || showSelectedOnly;
  const createFormValidationMessage =
    editingId !== null ? "" : form.menuIds.length === 0 ? "新增角色时必须至少选择一个菜单权限。" : "";

  const childrenMap = useMemo(() => {
    const map = new Map<number | null, MenuOption[]>();

    for (const menu of menus) {
      const key = menu.parentId ?? null;
      const current = map.get(key) ?? [];
      current.push(menu);
      map.set(key, current);
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.orderNum - b.orderNum || a.id - b.id);
    }

    return map;
  }, [menus]);

  const orderedMenus = useMemo(() => {
    const result: MenuOption[] = [];

    const walk = (parentId: number | null) => {
      const children = childrenMap.get(parentId) ?? [];

      for (const child of children) {
        result.push(child);
        walk(child.id);
      }
    };

    walk(null);
    return result;
  }, [childrenMap]);

  const filteredRoles = useMemo(() => {
    const normalizedKeyword = listKeyword.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesKeyword =
        !normalizedKeyword ||
        role.name.toLowerCase().includes(normalizedKeyword) ||
        role.code.toLowerCase().includes(normalizedKeyword) ||
        (role.remark ?? "").toLowerCase().includes(normalizedKeyword);
      const matchesStatus = listStatusFilter === "ALL" || role.status === listStatusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [listKeyword, listStatusFilter, roles]);

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set<number>();

      for (const menu of menus) {
        if ((childrenMap.get(menu.id) ?? []).length > 0) {
          next.add(menu.id);
        }
      }

      for (const id of current) {
        if (menuMap.has(id)) {
          next.add(id);
        }
      }

      return Array.from(next);
    });
  }, [childrenMap, menuMap, menus]);

  const menuVisibilitySet = useMemo(() => {
    const visible = new Set<number>();

    const includeAncestors = (menuId: number | null) => {
      let currentId = menuId;

      while (currentId) {
        visible.add(currentId);
        currentId = menuMap.get(currentId)?.parentId ?? null;
      }
    };

    const includeDescendants = (menuId: number) => {
      const children = childrenMap.get(menuId) ?? [];

      for (const child of children) {
        visible.add(child.id);
        includeDescendants(child.id);
      }
    };

    if (!keyword && !showSelectedOnly) {
      return new Set<number>(menus.map((menu) => menu.id));
    }

    for (const menu of orderedMenus) {
      const selectionState = getSelectionStateBase(menu.id, selectedSet);
      const matchesKeyword =
        !keyword ||
        menu.name.toLowerCase().includes(keyword) ||
        menu.type.toLowerCase().includes(keyword) ||
        (menu.perms ?? "").toLowerCase().includes(keyword);
      const matchesSelectedOnly = !showSelectedOnly || selectionState.checked || selectionState.indeterminate;

      if (matchesKeyword && matchesSelectedOnly) {
        visible.add(menu.id);
        includeAncestors(menu.parentId);

        if (matchesKeyword && !showSelectedOnly) {
          includeDescendants(menu.id);
        }
      }
    }

    return visible;
  }, [childrenMap, keyword, menuMap, menus, orderedMenus, selectedSet, showSelectedOnly]);

  function resetForm() {
    setEditingId(null);
    setIsModalOpen(false);
    setForm(emptyForm);
    setMenuKeyword("");
    setShowSelectedOnly(false);
    setError("");
  }

  function openCreate() {
    setEditingId(null);
    setIsModalOpen(true);
    setForm(emptyForm);
    setMenuKeyword("");
    setShowSelectedOnly(false);
    setError("");
  }

  function startEdit(role: RoleRecord) {
    setEditingId(role.id);
    setIsModalOpen(true);
    setError("");
    setShowSelectedOnly(false);
    setMenuKeyword("");
    setForm({
      name: role.name,
      code: role.code,
      orderNum: role.orderNum,
      status: role.status,
      remark: role.remark ?? "",
      menuIds: role.menuIds,
    });
  }

  function resetListFilters() {
    setListKeyword("");
    setListStatusFilter("ALL");
  }

  function collectDescendantIds(menuId: number): number[] {
    const result: number[] = [];
    const stack = [...(childrenMap.get(menuId) ?? [])];

    while (stack.length > 0) {
      const current = stack.pop();

      if (!current) {
        continue;
      }

      result.push(current.id);
      stack.push(...(childrenMap.get(current.id) ?? []));
    }

    return result;
  }

  function collectAncestorIds(menuId: number): number[] {
    const result: number[] = [];
    let currentParentId = menuMap.get(menuId)?.parentId ?? null;

    while (currentParentId) {
      result.push(currentParentId);
      currentParentId = menuMap.get(currentParentId)?.parentId ?? null;
    }

    return result;
  }

  function hasAnySelectedDescendant(menuId: number, selected: Set<number>) {
    return collectDescendantIds(menuId).some((id) => selected.has(id));
  }

  function getSelectionStateBase(menuId: number, selected: Set<number>) {
    const descendants = collectDescendantIds(menuId);
    const checkedDescendantCount = descendants.filter((id) => selected.has(id)).length;
    const checked = selected.has(menuId);
    const indeterminate = descendants.length > 0 && checkedDescendantCount > 0 && checkedDescendantCount < descendants.length;

    return {
      checked,
      indeterminate,
    };
  }

  function getSelectionState(menuId: number) {
    return getSelectionStateBase(menuId, selectedSet);
  }

  function toggleMenu(menuId: number) {
    setForm((current) => {
      const selected = new Set(current.menuIds);
      const descendants = collectDescendantIds(menuId);
      const ancestors = collectAncestorIds(menuId);

      if (selected.has(menuId)) {
        selected.delete(menuId);

        for (const descendantId of descendants) {
          selected.delete(descendantId);
        }

        for (const ancestorId of ancestors) {
          if (!selected.has(ancestorId)) {
            continue;
          }

          const shouldKeep = hasAnySelectedDescendant(ancestorId, selected);

          if (!shouldKeep) {
            selected.delete(ancestorId);
          }
        }
      } else {
        selected.add(menuId);

        for (const descendantId of descendants) {
          selected.add(descendantId);
        }

        for (const ancestorId of ancestors) {
          selected.add(ancestorId);
        }
      }

      return {
        ...current,
        menuIds: Array.from(selected),
      };
    });
  }

  function clearMenus() {
    setForm((current) => ({
      ...current,
      menuIds: [],
    }));
  }

  function toggleExpanded(menuId: number) {
    setExpandedIds((current) =>
      current.includes(menuId) ? current.filter((id) => id !== menuId) : [...current, menuId]
    );
  }

  function expandAllMenus() {
    setExpandedIds(
      menus
        .filter((menu) => (childrenMap.get(menu.id) ?? []).length > 0)
        .map((menu) => menu.id)
    );
  }

  function collapseAllMenus() {
    setExpandedIds([]);
  }

  function areAncestorsExpanded(menuId: number) {
    let currentParentId = menuMap.get(menuId)?.parentId ?? null;

    while (currentParentId) {
      if (!expandedIds.includes(currentParentId)) {
        return false;
      }

      currentParentId = menuMap.get(currentParentId)?.parentId ?? null;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (createFormValidationMessage) {
        throw new Error(createFormValidationMessage);
      }

      setLoading(true);

      const response = await fetch(
        editingId ? `/api/admin/system/roles/${editingId}` : "/api/admin/system/roles",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }

      resetForm();
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这个角色吗？")) {
      return;
    }

    const response = await fetch(`/api/admin/system/roles/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "删除失败");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">角色管理</h1>
          <p className="mt-1 text-xs text-gray-500">维护角色编码并分配菜单权限。</p>
        </div>
        {permissions.create ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新增角色
          </button>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm text-gray-700">
            关键字搜索
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={listKeyword}
              onChange={(event) => setListKeyword(event.target.value)}
              placeholder="角色名称 / 编码 / 备注"
            />
          </label>
          <label className="block text-sm text-gray-700">
            按状态筛选
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={listStatusFilter}
              onChange={(event) => setListStatusFilter(event.target.value as "ALL" | RoleRecord["status"])}
            >
              <option value="ALL">全部状态</option>
              <option value="ACTIVE">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500">当前筛选结果：{filteredRoles.length} 个角色</div>
          <button
            type="button"
            onClick={resetListFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            重置筛选
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">角色名称</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">角色编码</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">排序</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredRoles.map((role) => (
              <tr key={role.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{role.name}</td>
                <td className="px-4 py-3">{role.code}</td>
                <td className="px-4 py-3">{role.status === "ACTIVE" ? "启用" : "禁用"}</td>
                <td className="px-4 py-3">{role.orderNum}</td>
                <td className="px-4 py-3 text-gray-500">{role.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    {permissions.update ? (
                      <button type="button" onClick={() => startEdit(role)} className="text-blue-600 hover:text-blue-800">
                        编辑
                      </button>
                    ) : null}
                    {permissions.delete ? (
                      <button type="button" onClick={() => handleDelete(role.id)} className="text-red-600 hover:text-red-800">
                        删除
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRoles.length === 0 ? <div className="text-sm text-gray-500">当前筛选条件下暂无角色。</div> : null}

      <Modal
        open={isModalOpen}
        onClose={resetForm}
        title={editingId ? `编辑角色 #${editingId}` : "新增角色"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit}>
          {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
          {createFormValidationMessage ? (
            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{createFormValidationMessage}</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              角色名称
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label className="block text-sm text-gray-700">
              角色编码
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
            <label className="block text-sm text-gray-700">
              排序
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.orderNum}
                onChange={(event) => setForm({ ...form, orderNum: Number(event.target.value) })}
              />
            </label>
            <label className="block text-sm text-gray-700">
              状态
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as "ACTIVE" | "DISABLED" })}
              >
                <option value="ACTIVE">启用</option>
                <option value="DISABLED">禁用</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm text-gray-700">
            备注
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={3}
              value={form.remark}
              onChange={(event) => setForm({ ...form, remark: event.target.value })}
            />
          </label>

          <div className="mt-4 rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-gray-700">菜单权限</div>
                <div className="mt-1 text-xs text-gray-500">支持父子联动勾选。</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={expandAllMenus}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  展开全部
                </button>
                <button
                  type="button"
                  onClick={collapseAllMenus}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  收起全部
                </button>
                <button
                  type="button"
                  onClick={clearMenus}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                >
                  清空菜单
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="按菜单名称、类型或权限标识筛选"
                value={menuKeyword}
                onChange={(event) => setMenuKeyword(event.target.value)}
              />
              <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showSelectedOnly}
                  onChange={(event) => setShowSelectedOnly(event.target.checked)}
                />
                仅看已选
              </label>
            </div>

            <div className="mt-4 max-h-[40vh] space-y-2 overflow-y-auto">
              {orderedMenus
                .filter((menu) => menuVisibilitySet.has(menu.id))
                .map((menu) => {
                  const selectionState = getSelectionState(menu.id);
                  const hasChildren = (childrenMap.get(menu.id) ?? []).length > 0;
                  const isExpanded = expandedIds.includes(menu.id);
                  const parentVisible = menuHasFilters || areAncestorsExpanded(menu.id);

                  if (!parentVisible) {
                    return null;
                  }

                  return (
                    <div
                      key={menu.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleMenu(menu.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleMenu(menu.id);
                        }
                      }}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                        selectionState.checked || selectionState.indeterminate
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      style={{ marginLeft: `${menu.level * 20}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleExpanded(menu.id);
                          }}
                          className="h-6 w-6 rounded border border-gray-300 text-xs text-gray-600 hover:bg-gray-50"
                          aria-label={isExpanded ? "收起权限节点" : "展开权限节点"}
                        >
                          {isExpanded ? "-" : "+"}
                        </button>
                      ) : (
                        <span className="inline-block h-6 w-6" />
                      )}
                      <MenuCheckbox checked={selectionState.checked} indeterminate={selectionState.indeterminate} />
                      <span>{menu.name}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{menu.type}</span>
                      {selectionState.indeterminate ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">半选</span>
                      ) : null}
                      {menu.perms ? <span className="text-xs text-gray-400">{menu.perms}</span> : null}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || Boolean(createFormValidationMessage)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "保存中..." : editingId ? "保存修改" : "确认新增"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
