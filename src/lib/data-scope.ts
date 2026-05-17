import { DataScopeType } from "@/generated/prisma/client";
import { rawPrisma } from "@/lib/prisma";

export type ResolvedDataScope = {
  userId: number;
  deptId: number | null;
  dataScopeType: DataScopeType;
  allowedDeptIds: number[] | null;
};

export type ScopeWhereConfig = {
  deptField?: string;
  selfField?: string;
  fallbackField?: string;
};

const DATA_SCOPE_PRIORITY: Record<DataScopeType, number> = {
  [DataScopeType.SELF]: 1,
  [DataScopeType.DEPT]: 2,
  [DataScopeType.DEPT_AND_CHILD]: 3,
  [DataScopeType.ALL]: 4,
};

async function resolveDeptIdsByScope(
  dataScopeType: DataScopeType,
  deptId: number | null,
): Promise<number[] | null> {
  if (dataScopeType === DataScopeType.ALL) {
    return null;
  }

  if (dataScopeType === DataScopeType.SELF) {
    return [];
  }

  if (deptId === null) {
    return [];
  }

  if (dataScopeType === DataScopeType.DEPT) {
    return [deptId];
  }

  const depts = await rawPrisma.sysDept.findMany({
    where: {
      OR: [
        { id: deptId },
        { ancestors: { endsWith: `,${deptId}` } },
        { ancestors: { contains: `,${deptId},` } },
      ],
    },
    select: { id: true },
  });

  return depts.map((dept) => dept.id);
}

function pickHighestDataScopeType(roleDataScopes: DataScopeType[]): DataScopeType {
  if (roleDataScopes.length === 0) {
    return DataScopeType.SELF;
  }

  return roleDataScopes.reduce((highest, current) =>
    DATA_SCOPE_PRIORITY[current] > DATA_SCOPE_PRIORITY[highest] ? current : highest
  );
}

export async function resolveUserDataScope(params: {
  userId: number;
  deptId: number | null;
  isAdmin: boolean;
  roleDataScopes: DataScopeType[];
}): Promise<ResolvedDataScope> {
  const dataScopeType = params.isAdmin
    ? DataScopeType.ALL
    : pickHighestDataScopeType(params.roleDataScopes);

  return {
    userId: params.userId,
    deptId: params.deptId,
    dataScopeType,
    allowedDeptIds: await resolveDeptIdsByScope(dataScopeType, params.deptId),
  };
}

function buildImpossibleScopeWhere(field: string) {
  return {
    [field]: {
      in: [],
    },
  };
}

export function buildDataScopeWhere(
  scope: ResolvedDataScope,
  config: ScopeWhereConfig,
) {
  const fallbackField = config.fallbackField ?? config.selfField ?? config.deptField ?? "id";

  if (scope.dataScopeType === DataScopeType.ALL) {
    return {};
  }

  if (scope.dataScopeType === DataScopeType.SELF) {
    if (!config.selfField) {
      return buildImpossibleScopeWhere(fallbackField);
    }

    return {
      [config.selfField]: scope.userId,
    };
  }

  if (!config.deptField) {
    return buildImpossibleScopeWhere(fallbackField);
  }

  return {
    [config.deptField]: {
      in: scope.allowedDeptIds ?? [],
    },
  };
}
