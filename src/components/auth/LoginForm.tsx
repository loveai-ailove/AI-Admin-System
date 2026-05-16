"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SlideCaptcha from "./SlideCaptcha";

export function LoginForm({ canBootstrap }: { canBootstrap: boolean }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  // 验证码相关状态
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [captchaOffsetX, setCaptchaOffsetX] = useState<number | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<"idle" | "success" | "fail">("idle");
  const [captchaRefreshNonce, setCaptchaRefreshNonce] = useState(0);

  // 监听验证码组件加载完成，获取 captchaId
  const handleCaptchaReady = useCallback((id: string) => {
    setCaptchaId(id);
    setCaptchaOffsetX(null);
    setCaptchaStatus("idle");
  }, []);

  const handleCaptchaComplete = useCallback((offsetX: number | null) => {
    setCaptchaOffsetX(offsetX);
    setCaptchaStatus("idle");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setHint("");

    if (captchaOffsetX === null) {
      setError("请先完成验证码验证");
      return;
    }

    if (!captchaId) {
      setError("验证码已过期，请刷新");
      return;
    }

    setLoading(true);
    setCaptchaOffsetX(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          captchaId,
          captchaOffsetX,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.captchaError) {
          setCaptchaStatus("fail");
        } else {
          setCaptchaRefreshNonce((current) => current + 1);
        }
        throw new Error(data.error || "登录失败");
      }

      setCaptchaStatus("success");
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
        <h1 className="text-3xl font-bold text-gray-900">管理平台登录</h1>
        <p className="mt-2 text-sm text-gray-500">(1.0版)</p>
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

        {/* 滑动验证码 */}
        <div className="mb-2">
          <SlideCaptcha
            onComplete={handleCaptchaComplete}
            onReady={handleCaptchaReady}
            verificationStatus={captchaStatus}
            refreshNonce={captchaRefreshNonce}
          />
        </div>

        <button
          type="submit"
          disabled={loading || captchaOffsetX === null}
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
