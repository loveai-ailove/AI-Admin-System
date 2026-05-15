import { z } from "zod";
import { statusSchema } from "@/lib/validators/common";

export const systemDeptSchema = z.object({
  parentId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  name: z.string().trim().min(1, "请输入部门名称").max(30, "部门名称最多 30 位"),
  orderNum: z.coerce.number().int().min(0, "排序值不能小于 0").default(0),
  leader: z.union([z.string().trim().max(30, "负责人最多 30 位"), z.literal(""), z.null()]).optional(),
  phone: z.union([z.string().trim().max(20, "联系电话最多 20 位"), z.literal(""), z.null()]).optional(),
  email: z.union([z.string().email("邮箱格式不正确"), z.literal(""), z.null()]).optional(),
  status: statusSchema.default("ACTIVE"),
  remark: z.union([z.string().trim().max(500, "备注最多 500 位"), z.literal(""), z.null()]).optional(),
});
