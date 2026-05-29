import type { RuntimeNodeItemType } from "./types";
import type { RuntimeEdgeItemType } from "./types";

export type EdgeType = "tree" | "back" | "forward" | "cross";

export interface SCCResult {
  nodeToSCC: Map<string, number>;
  sccSizes: Map<number, number>;
}

export interface EdgeGroupInput {
  runtimeNodes: RuntimeNodeItemType[];
  edgeIndex: EdgeIndexData;
  nodesMap?: Map<string, RuntimeNodeItemType>;
}

export interface EdgeIndexData {
  bySource: Map<string, RuntimeEdgeItemType[]>;
  byTarget: Map<string, RuntimeEdgeItemType[]>;
}

export function findSCCs(runtimeNodes: RuntimeNodeItemType[], edgeIndex: EdgeIndexData): SCCResult {
  const nodeToSCC = new Map<string, number>();
  const sccSizes = new Map<number, number>();

  let sccId = 0;
  const stack: string[] = [];
  const inStack = new Set<string>();
  const lowLink = new Map<string, number>();
  const discoveryTime = new Map<string, number>();
  let time = 0;

  function tarjan(nodeId: string) {
    discoveryTime.set(nodeId, time);
    lowLink.set(nodeId, time);
    time++;
    stack.push(nodeId);
    inStack.add(nodeId);

    const outEdges = edgeIndex.bySource.get(nodeId) || [];
    for (const edge of outEdges) {
      const targetId = edge.target;
      if (targetId === nodeId) continue;

      if (!discoveryTime.has(targetId)) {
        tarjan(targetId);
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId)!, lowLink.get(targetId)!));
      } else if (inStack.has(targetId)) {
        lowLink.set(nodeId, Math.min(lowLink.get(nodeId)!, discoveryTime.get(targetId)!));
      }
    }

    if (lowLink.get(nodeId) === discoveryTime.get(nodeId)) {
      const sccNodes: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        inStack.delete(w);
        nodeToSCC.set(w, sccId);
        sccNodes.push(w);
      } while (w !== nodeId);

      sccSizes.set(sccId, sccNodes.length);
      sccId++;
    }
  }

  for (const node of runtimeNodes) {
    if (!discoveryTime.has(node.nodeId)) {
      tarjan(node.nodeId);
    }
  }

  return { nodeToSCC, sccSizes };
}

export function isNodeInCycle(
  nodeId: string,
  nodeToSCC: Map<string, number>,
  sccSizes: Map<number, number>
): boolean {
  const sccId = nodeToSCC.get(nodeId);
  if (sccId === undefined) return false;
  const size = sccSizes.get(sccId) || 0;
  return size > 1;
}

export function classifyEdgesByDFS(
  runtimeNodes: RuntimeNodeItemType[],
  edgeIndex: EdgeIndexData
): Map<string, EdgeType> {
  const edgeTypes = new Map<string, EdgeType>();
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const discoveryTime = new Map<string, number>();
  let time = 0;

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);
    discoveryTime.set(nodeId, ++time);

    const outEdges = edgeIndex.bySource.get(nodeId) || [];
    for (const edge of outEdges) {
      const edgeKey = `${edge.source}-${edge.target}-${edge.sourceHandle || "default"}`;
      const targetId = edge.target;

      if (!visited.has(targetId)) {
        edgeTypes.set(edgeKey, "tree");
        dfs(targetId);
      } else if (inStack.has(targetId)) {
        edgeTypes.set(edgeKey, "back");
      } else if (discoveryTime.get(edge.source)! < discoveryTime.get(targetId)!) {
        edgeTypes.set(edgeKey, "forward");
      } else {
        edgeTypes.set(edgeKey, "cross");
      }
    }

    inStack.delete(nodeId);
  }

  const entryNodes = runtimeNodes.filter((node) => {
    const inEdges = edgeIndex.byTarget.get(node.nodeId) || [];
    return inEdges.length === 0;
  });

  for (const node of entryNodes) {
    if (!visited.has(node.nodeId)) {
      dfs(node.nodeId);
    }
  }

  for (const node of runtimeNodes) {
    if (!visited.has(node.nodeId)) {
      dfs(node.nodeId);
    }
  }

  return edgeTypes;
}

export function getEdgeType(
  edge: RuntimeEdgeItemType,
  edgeTypes: Map<string, EdgeType>
): EdgeType | undefined {
  const edgeKey = `${edge.source}-${edge.target}-${edge.sourceHandle || "default"}`;
  return edgeTypes.get(edgeKey);
}
