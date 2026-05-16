"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

const segmentLabelMap: Record<string, string> = {
  admin: "后台",
  system: "系统管理",
  users: "用户管理",
  roles: "角色管理",
  menus: "菜单管理",
  depts: "部门管理",
  logs: "日志管理",
  oper: "操作日志",
  login: "登录日志",
  profile: "个人中心",
};

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const labels = useMemo(() => {
    return pathname
      .split("/")
      .filter(Boolean)
      .map((segment) => segmentLabelMap[segment] || segment);
  }, [pathname]);

  return <div className="text-sm text-gray-500">{labels.length > 0 ? labels.join(" / ") : "后台"}</div>;
}
