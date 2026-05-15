import { z } from "zod";

export const profileUpdateSchema = z.object({
  nickname: z.string().trim().min(1, "请输入昵称").max(30, "昵称最多 30 位"),
  email: z.union([z.string().email("邮箱格式不正确"), z.literal(""), z.null()]).optional(),
  mobile: z.union([z.string().trim().max(20, "手机号最多 20 位"), z.literal(""), z.null()]).optional(),
  remark: z.union([z.string().trim().max(500, "备注最多 500 位"), z.literal(""), z.null()]).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码"),
    newPassword: z.string().min(6, "新密码至少 6 位").max(50, "新密码最多 50 位"),
    confirmPassword: z.string().min(1, "请确认新密码"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "新密码至少 6 位").max(50, "新密码最多 50 位"),
});
