import { getCurrentUser } from "@/lib/auth/current-user";
import { assertPermission } from "@/lib/auth/permission";
import { createScopedPrisma } from "@/lib/prisma";
import { setRequestPrisma } from "@/lib/scope-context";

export async function requireApiPermission(permission?: string) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (permission) {
    assertPermission(user, permission);
  }

  setRequestPrisma(
    createScopedPrisma({
      userId: user.id,
      deptId: user.deptId,
      dataScopeType: user.dataScopeType,
      allowedDeptIds: user.allowedDeptIds,
    }),
  );


  return user;
}

export function getRequestMeta(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
  const userAgent = request.headers.get("user-agent") || null;
  return { ip, userAgent };
}
