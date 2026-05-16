import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
  captchaId: z.string().min(1, "验证码不能为空"),
  captchaOffsetX: z.coerce.number(),
});
