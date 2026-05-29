import { GLOBAL_VARIABLE_NODE_ID } from "./schema";

export type WorkflowVariableStateItem = {
  key: string;
  storeValue: unknown;
  runtimeValue: unknown;
  runtimeOnly?: boolean;
};

export class WorkflowVariableState {
  private state: Map<string, WorkflowVariableStateItem>;
  private sourceVariables?: Record<string, any>;

  private constructor(
    state: Map<string, WorkflowVariableStateItem>,
    sourceVariables?: Record<string, any>
  ) {
    this.state = state;
    this.sourceVariables = sourceVariables;
  }

  static create({
    variables,
    histories = [],
    userId,
    appId,
    chatId,
    userChatInput,
  }: {
    variables?: Record<string, any>;
    histories?: Array<{ obj: "Human" | "AI"; value: string }>;
    userId?: string;
    appId?: string;
    chatId?: string;
    userChatInput?: string;
  }): WorkflowVariableState {
    const state = new Map<string, WorkflowVariableStateItem>();
    const ws = new WorkflowVariableState(state);

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        ws.setVariable(key, value, false);
      }
    }

    ws.setRuntimeOnly({
      appId,
      chatId,
      histories,
    });

    if (userId) {
      state.set("userId", {
        key: "userId",
        storeValue: userId,
        runtimeValue: userId,
        runtimeOnly: true,
      });
    }

    if (userChatInput) {
      state.set("userChatInput", {
        key: "userChatInput",
        storeValue: userChatInput,
        runtimeValue: userChatInput,
        runtimeOnly: true,
      });
    }

    return ws;
  }

  get(key: string): unknown {
    const item = this.state.get(key);
    return item?.runtimeValue;
  }

  getStoreValue(key: string): unknown {
    const item = this.state.get(key);
    return item?.storeValue;
  }

  set(key: string, value: unknown): void {
    this.state.set(key, {
      key,
      storeValue: value,
      runtimeValue: value,
    });
  }

  setVariable(key: string, value: unknown, runtimeOnly = false): void {
    this.state.set(key, {
      key,
      storeValue: runtimeOnly ? undefined : value,
      runtimeValue: value,
      runtimeOnly,
    });
  }

  setRuntimeOnly(variables: Record<string, any>): void {
    for (const [key, value] of Object.entries(variables)) {
      if (value === undefined) continue;
      this.state.set(key, {
        key,
        storeValue: undefined,
        runtimeValue: value,
        runtimeOnly: true,
      });
    }
  }

  toRuntimeRecord(): Record<string, unknown> {
    const record: Record<string, unknown> = {};
    for (const item of this.state.values()) {
      record[item.key] = item.runtimeValue;
    }
    return record;
  }

  toStoreRecord(): Record<string, unknown> {
    const record: Record<string, unknown> = {};
    for (const item of this.state.values()) {
      if (!item.runtimeOnly) {
        record[item.key] = item.storeValue;
      }
    }
    return record;
  }

  clone(): WorkflowVariableState {
    const newState = new Map<string, WorkflowVariableStateItem>();
    for (const [key, item] of this.state.entries()) {
      newState.set(key, { ...item });
    }
    return new WorkflowVariableState(newState, this.sourceVariables);
  }
}

export function getVariableValue(data: Record<string, any>, path: string[]): any {
  let current: any = data;
  for (const key of path) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

export function resolveVariableReference(
  text: any,
  variables: Record<string, any>,
  nodesMap?: Map<string, any>,
  nodeOutputMap?: Map<string, Record<string, any>>
): any {
  return resolveRuntimeValue(text, variables, nodesMap, nodeOutputMap);
}

export function resolveRuntimeValue(
  value: any,
  variables: Record<string, any>,
  nodesMap?: Map<string, any>,
  nodeOutputMap?: Map<string, Record<string, any>>
): any {
  if (value === undefined || value === null) return value;

  if (isReferenceTuple(value)) {
    return getReferenceValue(value[0], value[1], variables, nodesMap, nodeOutputMap);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveRuntimeValue(item, variables, nodesMap, nodeOutputMap));
  }

  if (typeof value === "string") {
    return resolveTemplateString(value, variables, nodesMap, nodeOutputMap);
  }

  if (typeof value === "object") {
    if (isReferenceObject(value)) {
      return getReferenceValue(value.nodeId, value.outputKey, variables, nodesMap, nodeOutputMap);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        resolveRuntimeValue(item, variables, nodesMap, nodeOutputMap),
      ])
    );
  }

  return value;
}

function resolveTemplateString(
  text: string,
  variables: Record<string, any>,
  nodesMap?: Map<string, any>,
  nodeOutputMap?: Map<string, Record<string, any>>
) {
  const exactMatch = text.match(/^\{\{(.*?)\}\}$/);
  if (exactMatch) {
    return resolveInlineReference(exactMatch[1], variables, nodesMap, nodeOutputMap);
  }

  return text.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
    const value = resolveInlineReference(key, variables, nodesMap, nodeOutputMap);
    return safeStringify(value);
  });
}

function resolveInlineReference(
  rawKey: string,
  variables: Record<string, any>,
  nodesMap?: Map<string, any>,
  nodeOutputMap?: Map<string, Record<string, any>>
) {
  const trimmed = rawKey.trim();
  const dollarMatch = trimmed.match(/^\$(.+)\.(.+)\$$/);
  if (dollarMatch) {
    return getReferenceValue(dollarMatch[1], dollarMatch[2], variables, nodesMap, nodeOutputMap);
  }

  return getVariableValue(variables, trimmed.split("."));
}

function getReferenceValue(
  nodeId: string,
  outputKey: string,
  variables: Record<string, any>,
  nodesMap?: Map<string, any>,
  nodeOutputMap?: Map<string, Record<string, any>>
) {
  if (nodeId === GLOBAL_VARIABLE_NODE_ID) {
    return getVariableValue(variables, outputKey.split("."));
  }

  const runtimeOutputs = nodeOutputMap?.get(nodeId);
  if (runtimeOutputs && outputKey in runtimeOutputs) {
    return runtimeOutputs[outputKey];
  }

  const node = nodesMap?.get(nodeId);
  if (node?.outputs) {
    const output = node.outputs.find((item: any) => item.key === outputKey);
    if (output?.value !== undefined) {
      return output.value;
    }
  }

  return undefined;
}

function isReferenceTuple(value: any): value is [string, string] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === "string");
}

function isReferenceObject(value: any): value is { nodeId: string; outputKey: string } {
  return !!value && typeof value === "object" && typeof value.nodeId === "string" && typeof value.outputKey === "string";
}

function safeStringify(value: any): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function valueTypeFormat(value: any, valueType?: string): any {
  if (value === undefined || value === null) return value;
  if (!valueType) return value;

  const vt = String(valueType);

  if (vt === "string") return String(value);
  if (vt === "number") return Number(value);
  if (vt === "boolean") {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return Boolean(value);
  }
  if (vt === "object" || vt.startsWith("array")) {
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch {
      return {};
    }
  }

  return value;
}
