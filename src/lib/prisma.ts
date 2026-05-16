import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "ai_coding",
  allowPublicKeyRetrieval: true,

  // ── 连接池配置 ──
  // 最大连接数，根据服务器性能调整（建议：CPU 核心数 × 2 + 磁盘数）
  connectionLimit: 20,
  // 获取连接超时 5 秒，快速失败避免请求堆积
  acquireTimeout: 5000,
  // 空闲 60 秒后回收连接，释放数据库资源
  idleTimeout: 60,
  // 创建新连接超时 10 秒
  initializationTimeout: 10000,
  // 借用连接超过 30 秒未归还时输出日志告警（帮助排查连接泄漏）
  leakDetectionTimeout: 30000,
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
