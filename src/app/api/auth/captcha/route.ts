import { NextResponse } from "next/server";
import { generateSlideCaptcha } from "@/lib/captcha";

export async function GET() {
  try {
    const data = generateSlideCaptcha();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "验证码生成失败" }, { status: 500 });
  }
}
