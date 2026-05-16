"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfilePayload = {
  username: string;
  nickname: string;
  email: string | null;
  mobile: string | null;
  deptName: string | null;
  roleNames: string[];
  remark: string | null;
};

export function ProfileSettings({ profile }: { profile: ProfilePayload }) {
  const router = useRouter();
  const [profileForm, setProfileForm] = useState({
    nickname: profile.nickname,
    email: profile.email ?? "",
    mobile: profile.mobile ?? "",
    remark: profile.remark ?? "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: profileForm.nickname,
          email: profileForm.email || null,
          mobile: profileForm.mobile || null,
          remark: profileForm.remark || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "保存失败");
      }
      setProfileMessage("个人信息已更新");
      router.refresh();
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordMessage("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "修改密码失败");
      }
      setPasswordMessage(data.message || "密码已修改，请重新登录");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "修改密码失败");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人中心</h1>
        <p className="mt-1 text-sm text-gray-500">维护当前登录用户的资料与密码。</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleProfileSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 text-lg font-semibold text-gray-900">个人信息</div>
          {profileError ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{profileError}</div> : null}
          {profileMessage ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{profileMessage}</div> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              用户名
              <input className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2" value={profile.username} disabled />
            </label>
            <label className="block text-sm text-gray-700">
              昵称
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={profileForm.nickname}
                onChange={(event) => setProfileForm((current) => ({ ...current, nickname: event.target.value }))}
              />
            </label>
            <label className="block text-sm text-gray-700">
              邮箱
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="block text-sm text-gray-700">
              手机号
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={profileForm.mobile}
                onChange={(event) => setProfileForm((current) => ({ ...current, mobile: event.target.value }))}
              />
            </label>
            <label className="block text-sm text-gray-700">
              所属部门
              <input className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2" value={profile.deptName || "未分配部门"} disabled />
            </label>
            <label className="block text-sm text-gray-700">
              当前角色
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
                value={profile.roleNames.join("、") || "未分配角色"}
                disabled
              />
            </label>
          </div>

          <label className="mt-4 block text-sm text-gray-700">
            备注
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={4}
              value={profileForm.remark}
              onChange={(event) => setProfileForm((current) => ({ ...current, remark: event.target.value }))}
            />
          </label>

          <button
            type="submit"
            disabled={profileLoading}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {profileLoading ? "保存中..." : "保存个人信息"}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-4 text-lg font-semibold text-gray-900">修改密码</div>
          {passwordError ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{passwordError}</div> : null}
          {passwordMessage ? <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{passwordMessage}</div> : null}

          <div className="space-y-4">
            <label className="block text-sm text-gray-700">
              当前密码
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
              />
            </label>
            <label className="block text-sm text-gray-700">
              新密码
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </label>
            <label className="block text-sm text-gray-700">
              确认新密码
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {passwordLoading ? "提交中..." : "修改密码"}
          </button>
        </form>
      </div>
    </div>
  );
}
