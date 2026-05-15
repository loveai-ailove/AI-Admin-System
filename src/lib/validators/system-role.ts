import { z } from "zod";
import { statusSchema } from "@/lib/validators/common";

export const systemRoleSchema = z.object({
  name: z.string().trim().min(1, "请输入角色名称").max(30, "角色名称最多 30 位"),
  code: z.string().trim().min(1, "请输入角色编码").max(50, "角色编码最多 50 位"),
  orderNum: z.coerce.number().int().min(0, "排序值不能小于 0").default(0),
  status: statusSchema.default("ACTIVE"),
  menuIds: z.array(z.coerce.number().int().positive()).default([]),
  remark: z.union([z.string().trim().max(500, "备注最多 500 位"), z.literal(""), z.null()]).optional(),
});
