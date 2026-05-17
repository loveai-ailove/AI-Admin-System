import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  prisma?: unknown;
};

const requestContextStore = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  return requestContextStore.getStore() ?? {};
}

export function setRequestPrisma(prisma: unknown): void {
  const current = getRequestContext();
  requestContextStore.enterWith({
    ...current,
    prisma,
  });
}

export function getRequestPrisma<T>(): T | undefined {
  return getRequestContext().prisma as T | undefined;
}
