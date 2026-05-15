import { prisma } from "@/lib/prisma";
import { requireGuest } from "@/lib/auth/current-user";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  await requireGuest();
  const userCount = await prisma.sysUser.count();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-12">
      <LoginForm canBootstrap={userCount === 0} />
    </div>
  );
}
