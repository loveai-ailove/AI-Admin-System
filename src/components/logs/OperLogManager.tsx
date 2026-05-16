"use client";

import { Fragment, useState, useEffect, useCallback } from "react";

interface OperLog {
  id: number;
  userId: number | null;
  username: string | null;
  module: string;
  operType: string;
  description: string | null;
  method: string | null;
  requestUrl: string | null;
  requestParam: string | null;
  response: string | null;
  ip: string | null;
  status: string;
  errorMsg: string | null;
  operTime: string;
  costTime: number | null;
}

export function OperLogManager() {
  const [logs, setLogs] = useState<OperLog[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    username: "",
    module: "",
    operType: "",
    status: "",
    startTime: "",
    endTime: "",
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (filters.username) params.set("username", filters.username);
      if (filters.module) params.set("module", filters.module);
      if (filters.operType) params.set("operType", filters.operType);
      if (filters.status) params.set("status", filters.status);
      if (filters.startTime) params.set("startTime", filters.startTime);
      if (filters.endTime) params.set("endTime", filters.endTime);

      const res = await fetch(`/api/admin/logs/oper?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.list);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("获取操作日志失败:", error);
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
      module: "",
      operType: "",
      status: "",
      startTime: "",
      endTime: "",
    });
    setCurrentPage(1);
  }

  function getOperTypeText(type: string) {
    const typeMap: Record<string, string> = {
      CREATE: "新增",
      UPDATE: "修改",
      DELETE: "删除",
      QUERY: "查询",
      IMPORT: "导入",
      EXPORT: "导出",
      LOGIN: "登录",
      LOGOUT: "登出",
      OTHER: "其他",
    };
    return typeMap[type] || type;
  }

  function getStatusText(status: string) {
    return status === "ACTIVE" ? "成功" : "失败";
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">操作日志</h1>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm text-gray-700">
            操作人员
            <input
              type="text"
              value={filters.username}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              placeholder="请输入操作人员"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm text-gray-700">
            操作类型
            <select
              value={filters.operType}
              onChange={(e) => handleFilterChange("operType", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              <option value="CREATE">新增</option>
              <option value="UPDATE">修改</option>
              <option value="DELETE">删除</option>
              <option value="QUERY">查询</option>
              <option value="LOGIN">登录</option>
              <option value="LOGOUT">登出</option>
              <option value="OTHER">其他</option>
            </select>
          </label>
          <label className="block text-sm text-gray-700">
            状态
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">成功</option>
              <option value="DISABLED">失败</option>
            </select>
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

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作人员</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作类型</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">描述</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">请求地址</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">耗时(ms)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{log.username || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
                        {getOperTypeText(log.operType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.description || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{log.requestUrl || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          log.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {getStatusText(log.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.operTime}</td>
                    <td className="px-4 py-3 text-gray-500">{log.costTime || "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedId === log.id ? "收起" : "详情"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr>
                      <td colSpan={8} className="bg-gray-50 px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="text-sm font-medium text-gray-700">请求方法</div>
                            <div className="mt-1 text-sm text-gray-500">{log.method || "-"}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">IP 地址</div>
                            <div className="mt-1 text-sm text-gray-500">{log.ip || "-"}</div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-sm font-medium text-gray-700">请求参数</div>
                            <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-3 text-sm text-gray-500">
                              {log.requestParam || "-"}
                            </pre>
                          </div>
                          {log.response && (
                            <div className="md:col-span-2">
                              <div className="text-sm font-medium text-gray-700">响应数据</div>
                              <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-3 text-sm text-gray-500">
                                {log.response}
                              </pre>
                            </div>
                          )}
                          {log.errorMsg && (
                            <div className="md:col-span-2">
                              <div className="text-sm font-medium text-gray-700">错误信息</div>
                              <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-white p-3 text-sm text-red-500">
                                {log.errorMsg}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
