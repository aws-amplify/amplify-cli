import { Permission, AccessPatterns } from '../../core/migration-pipeline';
import { S3CloudFormationAccessParser } from '../../codegen-head/s3_cfn_access_parser';
import { DynamoDBCloudFormationAccessParser } from '../../codegen-head/dynamodb_cfn_access_parser';

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

export interface FunctionS3Access {
  functionName: string;
  pathPattern: string;
  permissions: Permission[];
}

export interface FunctionDynamoDBAccess {
  functionName: string;
  tableResource: string;
  actions: string[];
}

const PERMISSION_MAP: Record<CLIV1Permission, Permission[]> = {
  READ: ['read'],
  DELETE: ['delete'],
  CREATE_AND_UPDATE: ['write'],
};
const getGen2Permissions = (permissions: CLIV1Permission[]): Permission[] => {
  return permissions.flatMap((p) => PERMISSION_MAP[p]);
};
export const extractFunctionS3Access = (functionNames: string[], resourceName?: string): FunctionS3Access[] => {
  const functionAccess: FunctionS3Access[] = [];

  for (const functionName of functionNames) {
    const templates = S3CloudFormationAccessParser.findFunctionCloudFormationTemplates(functionName);

    for (const templatePath of templates) {
      const s3Permissions = S3CloudFormationAccessParser.parseTemplateFile(templatePath);

      for (const permission of s3Permissions) {
        if (resourceName && permission.bucketResource !== resourceName) {
          // Match CloudFormation parameter pattern: storage{resourceName}BucketName
          const bucketRefPattern = new RegExp(`storage${resourceName.replace(/[^a-zA-Z0-9]/g, '')}BucketName`);
          if (!bucketRefPattern.test(permission.bucketResource)) {
            continue;
          }
        }

        const gen2Permissions = S3CloudFormationAccessParser.mapS3ActionsToGen2Permissions(permission.actions);

        if (gen2Permissions.length > 0) {
          functionAccess.push({
            functionName,
            pathPattern: permission.pathPattern,
            permissions: gen2Permissions as Permission[],
          });
        }
      }
    }
  }

  return functionAccess;
};

export const extractFunctionDynamoDBAccess = (functionNames: string[], tableNames?: string[]): FunctionDynamoDBAccess[] => {
  const functionAccess: FunctionDynamoDBAccess[] = [];

  for (const functionName of functionNames) {
    const templates = DynamoDBCloudFormationAccessParser.findFunctionCloudFormationTemplates(functionName);

    for (const templatePath of templates) {
      const dynamoPermissions = DynamoDBCloudFormationAccessParser.parseTemplateFile(templatePath);

      for (const permission of dynamoPermissions) {
        if (tableNames && tableNames.length > 0) {
          const matchesTable = tableNames.some((tableName) => {
            const tableRefPattern = new RegExp(`storage${tableName.replace(/[^a-zA-Z0-9]/g, '')}Name`);
            return permission.tableResource === tableName || tableRefPattern.test(permission.tableResource);
          });
          if (!matchesTable) {
            continue;
          }
        }

        if (permission.actions.length > 0) {
          functionAccess.push({
            functionName,
            tableResource: permission.tableResource,
            actions: permission.actions,
          });
        }
      }
    }
  }

  return functionAccess;
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
