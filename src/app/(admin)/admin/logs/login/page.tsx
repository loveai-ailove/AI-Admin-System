import { requirePermission } from "@/lib/auth/permission";
import { LoginLogManager } from "@/components/logs/LoginLogManager";

export default async function LoginLogsPage() {
  await requirePermission("log:login:list");

  return <LoginLogManager />;
}
