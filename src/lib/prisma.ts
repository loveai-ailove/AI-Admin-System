import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";
import { buildDataScopeWhere, type ResolvedDataScope, type ScopeWhereConfig } from "@/lib/data-scope";
import { getRequestPrisma } from "@/lib/scope-context";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "ai_coding",
  allowPublicKeyRetrieval: true,

  connectionLimit: 20,
  acquireTimeout: 5000,
  idleTimeout: 60,
  initializationTimeout: 10000,
  leakDetectionTimeout: 30000,
});

const globalForPrisma = globalThis as unknown as {
  rawPrisma: PrismaClient | undefined;
};

export const rawPrisma =
  globalForPrisma.rawPrisma ?? new PrismaClient({ adapter });

const DEFAULT_SCOPE_MODEL_CONFIGS = {
  sysUser: {
    deptField: "deptId",
    selfField: "id",
    fallbackField: "id",
  },
} satisfies Record<string, ScopeWhereConfig>;

function applyScope<T extends Record<string, unknown>>(
  args: T,
  scope: ResolvedDataScope,
  config: ScopeWhereConfig,
): T {
  const scopeWhere = buildDataScopeWhere(scope, config);

  if (Object.keys(scopeWhere).length === 0) {
    return args;
  }

  return {
    ...args,
    where: (args as { where?: Record<string, unknown> }).where
      ? {
          AND: [scopeWhere, (args as { where?: Record<string, unknown> }).where],
        }
      : scopeWhere,
  } as unknown as T;
}

export function createScopedPrisma(
  scope: ResolvedDataScope,
  modelConfigs: Record<string, ScopeWhereConfig> = DEFAULT_SCOPE_MODEL_CONFIGS,
) {
  if (scope.dataScopeType === "ALL") {
    return rawPrisma;
  }

  const queryExtensions = Object.fromEntries(
    Object.entries(modelConfigs).map(([modelName, config]) => [
      modelName,
      {
        findMany({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          return query(applyScope(args, scope, config));
        },
        findFirst({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          return query(applyScope(args, scope, config));
        },
        findFirstOrThrow({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          return query(applyScope(args, scope, config));
        },
        count({ args, query }: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => unknown }) {
          return query(applyScope(args, scope, config));
        },
      },
    ]),
  ) as Record<string, unknown>;

  return rawPrisma.$extends({
    name: "data-scope",
    query: queryExtensions as never,
  });
}

function getActivePrismaClient() {
  return getRequestPrisma<ReturnType<typeof createScopedPrisma>>() ?? rawPrisma;
}

function bindMethod<T extends object>(target: T, value: unknown) {
  if (typeof value === "function") {
    return (value as (...args: unknown[]) => unknown).bind(target);
  }
  return value;
}

function createDelegateProxy(prop: PropertyKey) {
  return new Proxy(
    {},
    {
      get(_delegateTarget, delegateProp) {
        const client = getActivePrismaClient() as Record<PropertyKey, unknown>;
        const delegate = Reflect.get(client, prop, client);

        if (!delegate || typeof delegate !== "object") {
          return undefined;
        }

        const value = Reflect.get(delegate, delegateProp, delegate);
        return bindMethod(delegate, value);
      },
    },
  );
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getActivePrismaClient() as Record<PropertyKey, unknown>;
      const value = Reflect.get(client, prop, client);

      if (typeof prop === "symbol") {
        return value;
      }

      if (typeof value === "function") {
        return bindMethod(client, value);
      }

      if (value && typeof value === "object") {
        return createDelegateProxy(prop);
      }

      return value;
    },
  },
) as typeof rawPrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.rawPrisma = rawPrisma;
}
