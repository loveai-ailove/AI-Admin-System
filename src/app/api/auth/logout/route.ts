import { NextResponse } from "next/server";
import { clearSession, getSessionToken } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import { updateLogoutTime } from "@/lib/logger";
import { logOperation } from "@/lib/logger";
import { OperType } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const sessionToken = await getSessionToken();
    const user = await getCurrentUser();

    if (sessionToken) {
      await updateLogoutTime(sessionToken);
    }

    if (user) {
      await logOperation({
        request,
        module: "认证管理",
        operType: OperType.LOGOUT,
        description: `退出登录: ${user.username}`,
      });
    }

    await clearSession();
    return NextResponse.json({ message: "退出成功" });
  } catch (error) {
    return handleApiError(error, "退出失败");
  }
}
