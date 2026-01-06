import { Permission, AccessPatterns } from '../../core/migration-pipeline';

export type CLIV1Permission = 'READ' | 'CREATE_AND_UPDATE' | 'DELETE';
export type StorageCLIInputsJSON = {
  resourceName?: string;
  policyUUID?: string;
  bucketName?: string;
  storageAccess?: string;
  guestAccess: CLIV1Permission[];
  authAccess: CLIV1Permission[];
  triggerFunction?: string;
  groupAccess?: Record<string, CLIV1Permission[]>;
};

const PERMISSION_MAP: Record<CLIV1Permission, Permission[]> = {
  READ: ['read'],
  DELETE: ['delete'],
  CREATE_AND_UPDATE: ['write'],
};
const getGen2Permissions = (permissions: CLIV1Permission[]): Permission[] => {
  return permissions.flatMap((p) => PERMISSION_MAP[p]);
};
export const getStorageAccess = (input: StorageCLIInputsJSON): AccessPatterns => {
  let groups: AccessPatterns['groups'] | undefined;
  if (input.groupAccess && Object.keys(input.groupAccess).length > 0) {
    groups = Object.entries(input.groupAccess).reduce((acc, [key, value]) => {
      acc[key] = getGen2Permissions(value);
      return acc;
    }, {} as NonNullable<AccessPatterns['groups']>);
  }
  return {
    guest: getGen2Permissions(input.guestAccess),
    auth: getGen2Permissions(input.authAccess),
    groups,
  };
};
