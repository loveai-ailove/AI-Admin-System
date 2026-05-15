"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export function AdminHeader({
  nickname,
  deptName,
}: {
  nickname: string;
  deptName: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <AdminBreadcrumb />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div>
            昵称：<span className="font-medium text-gray-900">{nickname}</span>，部门：<span className="font-medium text-gray-900">{deptName || "未分配部门"}</span>
          </div>
          <Link href="/admin/profile" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50">
            个人中心
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "退出中..." : "退出登录"}
          </button>
        </div>
      </div>
    </header>
  );
}
