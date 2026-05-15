import { z } from "zod";
import { menuTypeSchema, statusSchema } from "@/lib/validators/common";

export const systemMenuSchema = z.object({
  parentId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  name: z.string().trim().min(1, "请输入菜单名称").max(30, "菜单名称最多 30 位"),
  type: menuTypeSchema,
  path: z.union([z.string().trim().max(100, "路径最多 100 位"), z.literal(""), z.null()]).optional(),
  component: z.union([z.string().trim().max(100, "组件标识最多 100 位"), z.literal(""), z.null()]).optional(),
  perms: z.union([z.string().trim().max(100, "权限标识最多 100 位"), z.literal(""), z.null()]).optional(),
  icon: z.union([z.string().trim().max(50, "图标最多 50 位"), z.literal(""), z.null()]).optional(),
  orderNum: z.coerce.number().int().min(0, "排序值不能小于 0").default(0),
  visible: z.coerce.boolean().default(true),
  status: statusSchema.default("ACTIVE"),
  remark: z.union([z.string().trim().max(500, "备注最多 500 位"), z.literal(""), z.null()]).optional(),
});
