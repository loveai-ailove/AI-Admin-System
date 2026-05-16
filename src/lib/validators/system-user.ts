import { z } from "zod";
import { statusSchema } from "@/lib/validators/common";

export const systemUserSchema = z.object({
  username: z.string().trim().min(2, "用户名至少 2 位").max(30, "用户名最多 30 位"),
  nickname: z.string().trim().min(1, "请输入用户昵称").max(30, "用户昵称最多 30 位"),
  password: z.string().min(6, "密码至少 6 位").max(50, "密码最多 50 位").optional(),
  email: z.union([z.string().email("邮箱格式不正确"), z.literal(""), z.null()]).optional(),
  mobile: z.union([z.string().trim().max(20, "手机号最多 20 位"), z.literal(""), z.null()]).optional(),
  deptId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  status: statusSchema.default("ACTIVE"),
  roleIds: z.array(z.coerce.number().int().positive()).default([]),
  remark: z.union([z.string().trim().max(500, "备注最多 500 位"), z.literal(""), z.null()]).optional(),
});
