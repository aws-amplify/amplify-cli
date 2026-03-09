import path from 'node:path';
import fs from 'node:fs/promises';
import { pathManager } from '@aws-amplify/amplify-cli-core';

export interface RestApiPath {
  readonly path: string;
  readonly methods: string[];
  readonly authType?: string;
  readonly lambdaFunction?: string;
  readonly userPoolGroups?: string[];
  readonly permissions?: {
    readonly hasAuth?: boolean;
    readonly groups?: Record<string, string[]>;
  };
}

export interface RestApiDefinition {
  readonly apiName: string;
  readonly functionName: string;
  readonly paths: RestApiPath[];
  readonly authType?: string;
  readonly corsConfiguration?: CorsConfiguration;
  readonly uniqueFunctions?: string[];
}

export interface CorsConfiguration {
  readonly allowCredentials?: boolean;
  readonly allowHeaders?: string[];
  readonly allowMethods?: string[];
  readonly allowOrigins?: string[];
  readonly exposeHeaders?: string[];
  readonly maxAge?: number;
}

/**
 * Reads REST API configurations from the local Gen1 project's cli-inputs.json files.
 */
export async function readRestApis(apiCategory: Record<string, unknown>): Promise<RestApiDefinition[]> {
  const rootDir = pathManager.findProjectRoot();
  if (!rootDir) {
    throw new Error('Could not find Amplify project root');
  }

  const restApis: RestApiDefinition[] = [];

  for (const apiName of Object.keys(apiCategory)) {
    const apiObj = apiCategory[apiName] as Record<string, unknown>;
    if (apiObj.service !== 'API Gateway') continue;

    const cliInputsPath = path.join(rootDir, 'amplify', 'backend', 'api', apiName, 'cli-inputs.json');
    const cliInputs = JSON.parse(await fs.readFile(cliInputsPath, 'utf8')) as {
      paths?: Record<
        string,
        {
          methods?: string[];
          permissions?: {
            setting?: 'private' | 'protected' | 'open';
            auth?: string[];
            groups?: Record<string, string[]>;
          };
          lambdaFunction?: string;
          restrictAccess?: boolean;
          groupAccess?: string[];
        }
      >;
      corsConfiguration?: CorsConfiguration;
      restrictAccess?: boolean;
      authType?: string;
    };

    const paths = cliInputs.paths
      ? Object.entries(cliInputs.paths).map(([pathName, pathConfig]) => {
          const pathAuthType = pathConfig.permissions?.setting || 'open';

          const userPoolGroups = pathConfig.permissions?.groups ? Object.keys(pathConfig.permissions.groups) : undefined;

          const permissions: { hasAuth?: boolean; groups?: Record<string, string[]> } = {};
          if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
            permissions.hasAuth = true;
          }
          if (pathConfig.permissions?.groups && Object.keys(pathConfig.permissions.groups).length > 0) {
            permissions.groups = pathConfig.permissions.groups;
          }

          return {
            path: pathName,
            methods: extractMethodsFromPath(pathConfig),
            authType: pathAuthType,
            lambdaFunction: pathConfig.lambdaFunction,
            userPoolGroups,
            ...(Object.keys(permissions).length > 0 && { permissions }),
          };
        })
      : [{ path: '/{proxy+}', methods: ['ANY'] }];

    const hasPathAuth = Object.values(cliInputs.paths || {}).some(
      (p) => p.permissions?.setting === 'private' || p.permissions?.setting === 'protected',
    );

    const authType = cliInputs.restrictAccess || hasPathAuth ? cliInputs.authType || 'AWS_IAM' : undefined;

    const dependsOn = (apiObj.dependsOn ?? []) as Array<{ category: string; resourceName: string }>;
    const defaultFunctionName = dependsOn.find((dep) => dep.category === 'function')?.resourceName;

    const uniqueFunctions = new Set<string>();
    if (defaultFunctionName) {
      uniqueFunctions.add(defaultFunctionName);
    }
    for (const p of paths) {
      if (p.lambdaFunction) {
        uniqueFunctions.add(p.lambdaFunction);
      }
    }

    restApis.push({
      apiName,
      functionName: defaultFunctionName || 'defaultFunction',
      paths,
      authType,
      corsConfiguration: cliInputs.corsConfiguration,
      uniqueFunctions: Array.from(uniqueFunctions),
    });
  }

  return restApis;
}

function extractMethodsFromPath(pathConfig: {
  methods?: string[];
  permissions?: { auth?: string[]; groups?: Record<string, string[]> };
}): string[] {
  if (pathConfig.methods && pathConfig.methods.length > 0) {
    return pathConfig.methods;
  }

  if (pathConfig.permissions?.auth && pathConfig.permissions.auth.length > 0) {
    return mapPermissionsToMethods(pathConfig.permissions.auth);
  }

  if (pathConfig.permissions?.groups) {
    const allPermissions = new Set<string>();
    for (const permissions of Object.values(pathConfig.permissions.groups)) {
      for (const permission of permissions) {
        allPermissions.add(permission);
      }
    }
    return mapPermissionsToMethods(Array.from(allPermissions));
  }

  return ['GET'];
}

function mapPermissionsToMethods(permissions: string[]): string[] {
  const methodMap: Record<string, string> = {
    read: 'GET',
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE',
  };

  const methods = permissions.map((p) => methodMap[p]).filter((m): m is string => m !== undefined);

  return methods.length > 0 ? methods : ['GET'];
}
