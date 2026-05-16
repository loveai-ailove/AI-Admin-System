"use client";

import { useCallback, useEffect, useState } from "react";

interface SlideCaptchaProps {
  onComplete: (offsetX: number | null) => void;
  onReady?: (captchaId: string) => void;
  verificationStatus?: "idle" | "success" | "fail";
  refreshNonce?: number;
}

export default function SlideCaptcha({
  onComplete,
  onReady,
  verificationStatus = "idle",
  refreshNonce = 0,
}: SlideCaptchaProps) {
  const [captchaData, setCaptchaData] = useState<{
    captchaId: string;
    backgroundImage: string;
    blockImage: string;
    blockSize: number;
    blockY: number;
    canvasWidth: number;
    canvasHeight: number;
  } | null>(null);

  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<"idle" | "dragged" | "success" | "fail">("idle");

  // ── 获取验证码图片 ──
  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/captcha");
      if (!res.ok) return;
      const data = await res.json();
      setCaptchaData(data);
      setOffset(0);
      setStatus("idle");
      onComplete(null);
      if (onReady) {
        onReady(data.captchaId);
      }
    } catch {
      // fetch failed silently
    }
  }, [onComplete, onReady]);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  useEffect(() => {
    if (verificationStatus === "success") {
      setStatus("success");
      return;
    }

    if (verificationStatus === "fail") {
      setStatus("fail");
      const timer = window.setTimeout(() => {
        fetchCaptcha();
      }, 800);
      return () => window.clearTimeout(timer);
    }
  }, [verificationStatus, fetchCaptcha]);

  useEffect(() => {
    if (refreshNonce === 0) {
      return;
    }

    fetchCaptcha();
  }, [refreshNonce, fetchCaptcha]);

  const maxSliderOffset = captchaData ? captchaData.canvasWidth - captchaData.blockSize : 0;

  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!captchaData || status === "success") {
        return;
      }

      const nextOffset = Number(event.target.value);
      const clampedOffset = Math.max(0, Math.min(nextOffset, maxSliderOffset));
      const hasDragged = clampedOffset > 0;

      setOffset(clampedOffset);
      setStatus(hasDragged ? "dragged" : "idle");
      onComplete(hasDragged ? clampedOffset : null);
    },
    [captchaData, status, maxSliderOffset, onComplete]
  );

  // ── 刷新按钮点击 ──
  const handleRefresh = useCallback(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  if (!captchaData) {
    return (
      <div className="relative w-full overflow-hidden border border-gray-200 border-dashed rounded-md bg-gray-50" style={{ height: 160 }}>
        <div className="flex items-center justify-center w-full h-full text-sm text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* 提示文字 */}
      {status === "idle" && (
        <div className="absolute inset-x-0 -bottom-7 text-center text-sm text-gray-400 pointer-events-none">
          拖动下方滑动条，让拼图块移动到缺口处
        </div>
      )}

      {/* 验证码图片容器 */}
      <div
        className="relative overflow-hidden rounded-md"
        style={{ aspectRatio: `${captchaData.canvasWidth} / ${captchaData.canvasHeight}` }}
      >
        {/* 背景图 */}
        <img src={captchaData.backgroundImage} alt="captcha" className="block w-full h-full" draggable={false} />

        {/* 拼图块（由滑动条驱动） */}
        <img
          src={captchaData.blockImage}
          alt="block"
          className="absolute pointer-events-none"
          style={{
            left: `${(offset / captchaData.canvasWidth) * 100}%`,
            top: `${(captchaData.blockY / captchaData.canvasHeight) * 100}%`,
            height: `${((captchaData.blockSize + 10) / captchaData.canvasHeight) * 100}%`,
            width: `${(captchaData.blockSize / captchaData.canvasWidth) * 100}%`,
            userSelect: "none",
            filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.4))",
          }}
          draggable={false}
        />
      </div>

      <div className="mt-4 px-1">
        <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
          <span>向右滑动完成拼图</span>
          <span />
        </div>
        <input
          type="range"
          min={0}
          max={maxSliderOffset}
          step={1}
          value={Math.min(offset, maxSliderOffset)}
          onChange={handleSliderChange}
          className="h-2 w-full cursor-ew-resize appearance-none rounded-full bg-gray-200 accent-blue-600"
          aria-label="滑动验证码"
        />
      </div>

      {/* 刷新按钮 */}
      <button
        type="button"
        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        onClick={handleRefresh}
        title="刷新验证码"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </button>

      {/* 验证状态指示 */}
      {status === "success" && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500 text-white text-xs font-medium">验证通过</div>
      )}
      {status === "fail" && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-xs font-medium">验证失败</div>
      )}
    </div>
  );
}
