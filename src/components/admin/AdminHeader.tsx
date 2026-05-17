"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";

export function AdminHeader({
  nickname,
  deptName,
  onOpenSidebar,
}: {
  nickname: string;
  deptName: string | null;
  onOpenSidebar: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="打开菜单"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <AdminBreadcrumb />
        </div>

        <div className="hidden items-center gap-3 text-sm text-gray-600 sm:flex">
          <span>
            昵称：<span className="font-medium text-gray-900">{nickname}</span>，部门：<span className="font-medium text-gray-900">{deptName || "未分配部门"}</span>
          </span>
          <Link href="/admin/profile" className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 whitespace-nowrap">
            个人中心
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
          >
            {loading ? "退出中..." : "退出登录"}
          </button>
        </div>

        <div className="relative sm:hidden" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="用户菜单"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </button>

          {userMenuOpen ? (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="text-sm font-medium text-gray-900">{nickname}</div>
                <div className="mt-0.5 text-xs text-gray-500">{deptName || "未分配部门"}</div>
              </div>
              <div className="p-2">
                <Link
                  href="/admin/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  个人中心
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loading}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {loading ? "退出中..." : "退出登录"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
