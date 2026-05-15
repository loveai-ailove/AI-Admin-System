"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ canBootstrap }: { canBootstrap: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setHint("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "登录失败");
      }

      router.push("/admin");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrap() {
    setBootstrapping(true);
    setError("");
    setHint("");

    try {
      const response = await fetch("/api/auth/bootstrap", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "初始化失败");
      }

      setUsername(data.username);
      setPassword(data.password);
      setHint(`系统已初始化，默认账号：${data.username}，默认密码：${data.password}`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "初始化失败");
    } finally {
      setBootstrapping(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">后台登录</h1>
        <p className="mt-2 text-sm text-gray-500">Next.js + Prisma 权限系统第一版</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
        {hint ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{hint}</div> : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">用户名</label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="请输入用户名"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">密码</label>
          <input
            type="password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none ring-blue-500 focus:ring-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入密码"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      {canBootstrap ? (
        <div className="mt-6 rounded-xl border border-dashed border-blue-200 bg-blue-50 p-4">
          <div className="text-sm text-blue-800">当前系统未检测到后台账号，可先初始化默认管理员。</div>
          <button
            type="button"
            onClick={handleBootstrap}
            disabled={bootstrapping}
            className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {bootstrapping ? "初始化中..." : "初始化系统默认数据"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
