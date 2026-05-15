import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return jsonError(error.issues[0]?.message || "请求参数错误", 400);
  }

  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return jsonError("请先登录", 401);
    }

    if (error.message === "FORBIDDEN") {
      return jsonError("没有权限执行该操作", 403);
    }

    if (error.message === "NOT_FOUND") {
      return jsonError("数据不存在", 404);
    }

    if (error.message === "CONFLICT") {
      return jsonError("数据已存在，不能重复提交", 409);
    }

    return jsonError(error.message || fallbackMessage, 400);
  }

  console.error(error);
  return jsonError(fallbackMessage, 500);
}
