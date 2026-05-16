import { requirePermission } from "@/lib/auth/permission";
import { OperLogManager } from "@/components/logs/OperLogManager";

export default async function OperLogsPage() {
  await requirePermission("log:oper:list");

  return <OperLogManager />;
}
