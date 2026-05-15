import { bootstrapSystem } from "@/lib/system/bootstrap";
import { handleApiError } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const result = await bootstrapSystem();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error, "系统初始化失败");
  }
}
