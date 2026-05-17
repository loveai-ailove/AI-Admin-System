"use client";

import { useState, useEffect, useCallback } from "react";

interface LoginLog {
  id: number;
  userId: number | null;
  username: string | null;
  ip: string | null;
  userAgent: string | null;
  status: string;
  loginTime: string;
  logoutTime: string | null;
  msg: string | null;
}

export function LoginLogManager() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    username: "",
    status: "",
    ip: "",
    startTime: "",
    endTime: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (filters.username) params.set("username", filters.username);
      if (filters.status) params.set("status", filters.status);
      if (filters.ip) params.set("ip", filters.ip);
      if (filters.startTime) params.set("startTime", filters.startTime);
      if (filters.endTime) params.set("endTime", filters.endTime);

      const res = await fetch(`/api/admin/logs/login?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.list);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("获取登录日志失败:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function handleFilterChange(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }

  function resetFilters() {
    setFilters({
      username: "",
      status: "",
      ip: "",
      startTime: "",
      endTime: "",
    });
    setCurrentPage(1);
  }

  function getStatusText(status: string) {
    return status === "SUCCESS" ? "成功" : "失败";
  }

  function formatUserAgent(userAgent: string | null) {
    if (!userAgent) return "-";
    if (userAgent.length > 50) {
      return userAgent.substring(0, 50) + "...";
    }
    return userAgent;
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">登录日志</h1>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm text-gray-700">
            用户名
            <input
              type="text"
              value={filters.username}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              placeholder="请输入用户名"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm text-gray-700">
            状态
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="SUCCESS">成功</option>
              <option value="FAIL">失败</option>
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            IP 地址
            <input
              type="text"
              value={filters.ip}
              onChange={(e) => handleFilterChange("ip", e.target.value)}
              placeholder="请输入 IP 地址"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm text-gray-700">
            开始时间
            <input
              type="datetime-local"
              value={filters.startTime}
              onChange={(e) => handleFilterChange("startTime", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm text-gray-700">
            结束时间
            <input
              type="datetime-local"
              value={filters.endTime}
              onChange={(e) => handleFilterChange("endTime", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-500">共 {total} 条记录</div>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            重置筛选
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">用户名</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">IP 地址</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">浏览器</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">登录时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">登出时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 whitespace-nowrap">信息</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{log.username || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{log.ip || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    <span title={log.userAgent || ""}>{formatUserAgent(log.userAgent)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {getStatusText(log.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.loginTime}</td>
                  <td className="px-4 py-3 text-gray-500">{log.logoutTime || "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{log.msg || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">
            共 {total} 条记录，第 {currentPage}/{totalPages} 页
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
