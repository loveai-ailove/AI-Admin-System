import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ message: "退出成功" });
  } catch (error) {
    return handleApiError(error, "退出失败");
  }
}
