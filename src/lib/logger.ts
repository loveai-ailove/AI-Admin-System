import { prisma } from "./prisma";
import { getCurrentUser } from "./auth/current-user";
import { getRequestMeta } from "./auth/api-auth";
import { OperType, Status, LoginStatus } from "@/generated/prisma/client";

export interface OperLogParams {
  module: string;
  operType: OperType;
  description?: string;
  request?: Request;
  requestParam?: string;
  response?: string;
  status?: Status;
  errorMsg?: string;
  costTime?: number;
}

/**
 * 敏感字段白名单（不区分大小写）
 */
const SENSITIVE_FIELDS = new Set([
  "password",
  "passwordhash",
  "newpassword",
  "currentpassword",
  "oldpassword",
  "confirm_password",
  "confirmpassword",
  "token",
  "access_token",
  "secret",
]);

/**
 * 递归清除对象中的敏感字段
 */
function redactSensitiveFields(obj: unknown): unknown {
  if (obj == null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveFields(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = "**REDACTED**";
    } else {
      result[key] = redactSensitiveFields(value);
    }
  }
  return result;
}

/**
 * 日志脱敏：去除 JSON 字符串中的敏感字段
 * 适用于请求参数、响应数据等操作日志字段
 */
function sanitizeLogData(data: string | undefined): string | undefined {
  if (!data) return data;

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return data; // 不是合法 JSON 时原样返回
  }

  return JSON.stringify(redactSensitiveFields(parsed));
}

export async function logOperation(params: OperLogParams) {
  try {
    let userId: number | undefined;
    let username: string | undefined;

    try {
      const user = await getCurrentUser();
      if (user) {
        userId = user.id;
        username = user.username;
      }
    } catch {
      // 忽略获取用户失败的情况
    }

    let ip: string | null = null;
    let method: string | undefined;
    let requestUrl: string | undefined;

    if (params.request) {
      const meta = getRequestMeta(params.request);
      ip = meta.ip;
      method = params.request.method;
      requestUrl = params.request.url;
    }

    await prisma.sysOperLog.create({
      data: {
        userId,
        username,
        module: params.module,
        operType: params.operType,
        description: params.description,
        method,
        requestUrl,
        requestParam: sanitizeLogData(params.requestParam),
        response: sanitizeLogData(params.response),
        ip,
        status: params.status || Status.ACTIVE,
        errorMsg: params.errorMsg,
        costTime: params.costTime,
      },
    });
  } catch (error) {
    console.error("记录操作日志失败:", error);
  }
}

export interface LoginLogParams {
  userId?: number;
  sessionToken?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  status: LoginStatus;
  msg?: string;
}

export async function logLogin(params: LoginLogParams) {
  try {
    await prisma.sysLoginLog.create({
      data: {
        userId: params.userId,
        sessionToken: params.sessionToken,
        username: params.username,
        ip: params.ip,
        userAgent: params.userAgent,
        status: params.status,
        msg: params.msg,
      },
    });
  } catch (error) {
    console.error("记录登录日志失败:", error);
  }
}

export async function updateLogoutTime(sessionToken: string) {
  try {
    await prisma.sysLoginLog.updateMany({
      where: { sessionToken, logoutTime: null },
      data: { logoutTime: new Date() },
    });
  } catch (error) {
    console.error("更新登出时间失败:", error);
  }
}

export async function updateLogoutTimeBySessionTokens(sessionTokens: string[]) {
  if (sessionTokens.length === 0) {
    return;
  }

  try {
    await prisma.sysLoginLog.updateMany({
      where: {
        sessionToken: { in: sessionTokens },
        logoutTime: null,
      },
      data: { logoutTime: new Date() },
    });
  } catch (error) {
    console.error("更新登出时间失败:", error);
  }
}

const LOG_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

export async function cleanupOldLogs() {
  const cutoff = new Date(Date.now() - LOG_RETENTION_MS);

  let operCount = 0;
  try {
    const operResult = await prisma.sysOperLog.deleteMany({
      where: { operTime: { lt: cutoff } },
    });
    operCount = operResult.count;
  } catch (error) {
    console.error("清理操作日志失败:", error);
  }

  let loginCount = 0;
  try {
    const loginResult = await prisma.sysLoginLog.deleteMany({
      where: { loginTime: { lt: cutoff } },
    });
    loginCount = loginResult.count;
  } catch (error) {
    console.error("清理登录日志失败:", error);
  }

  if (operCount > 0 || loginCount > 0) {
    console.log(`清理日志完成: 操作日志 ${operCount} 条, 登录日志 ${loginCount} 条 (保留近6个月)`);
  }
}

const logCleanupInterval = setInterval(
  () => {
    cleanupOldLogs().catch((error) => {
      console.error("定时清理日志失败:", error);
    });
  },
  24 * 60 * 60 * 1000
);

if (typeof process !== "undefined") {
  process.on("SIGTERM", () => clearInterval(logCleanupInterval));
  process.on("SIGINT", () => clearInterval(logCleanupInterval));
}
