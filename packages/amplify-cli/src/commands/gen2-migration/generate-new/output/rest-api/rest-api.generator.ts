import ts from 'typescript';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { CorsConfiguration, RestApiDefinition, RestApiPath, RestApiRenderer } from './rest-api.renderer';

const factory = ts.factory;

/**
 * Generates a single REST API (API Gateway) resource and contributes
 * CDK constructs to backend.ts.
 *
 * REST APIs in Gen1 are backed by API Gateway + Lambda. In Gen2,
 * they're generated as CDK constructs directly in backend.ts.
 * Each REST API gets its own CloudFormation stack with a RestApi,
 * LambdaIntegration, and IAM policies.
 */
export class RestApiGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly resourceName: string;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, resourceName: string) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.resourceName = resourceName;
  }

  /**
   * Plans the REST API generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const restApi = await RestApiGenerator.readRestApiConfig(this.gen1App, this.resourceName);
    const functionCategory = this.gen1App.meta('function');
    const functionNames = new Set<string>(Object.keys((functionCategory as object) ?? {}));
    const hasAuth = this.gen1App.meta('auth') !== undefined;
    const renderer = new RestApiRenderer(hasAuth, functionNames);

    return [
      {
        describe: async () => [`Generate REST API ${restApi.apiName} in amplify/backend.ts`],
        execute: async () => {
          this.addRestApiImports();
          this.addFunctionImports(restApi, functionNames);

          this.backendGenerator.ensureBranchName();
          const statements = renderer.renderApi(restApi);
          for (const statement of statements) {
            this.backendGenerator.addStatement(statement);
          }
        },
      },
    ];
  }

  private addRestApiImports(): void {
    this.backendGenerator.addImport('aws-cdk-lib/aws-apigateway', [
      'RestApi',
      'LambdaIntegration',
      'AuthorizationType',
      'Cors',
      'ResponseType',
    ]);
    this.backendGenerator.addImport('aws-cdk-lib/aws-iam', ['Policy', 'PolicyStatement']);
    this.backendGenerator.addImport('aws-cdk-lib', ['Stack']);
  }

  /**
   * Adds function imports for unique functions used by this REST API
   * that aren't already registered by the main function generator.
   */
  private addFunctionImports(restApi: { readonly uniqueFunctions?: readonly string[] }, functionNames: ReadonlySet<string>): void {
    if (!restApi.uniqueFunctions) return;

    for (const funcName of restApi.uniqueFunctions) {
      if (functionNames.has(funcName)) continue;
      this.backendGenerator.addImport(`./function/${funcName}/resource`, [funcName]);
      this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier(funcName)));
    }
  }

  /**
   * Reads the REST API definition for a single API Gateway resource
   * from local cli-inputs.json and amplify-meta.json.
   */
  private static async readRestApiConfig(gen1App: Gen1App, resourceName: string): Promise<RestApiDefinition> {
    const apiCategory = gen1App.meta('api');
    if (!apiCategory) {
      throw new Error('API category not found in amplify-meta.json');
    }

    const apiObj = apiCategory[resourceName] as Record<string, unknown> | undefined;
    if (!apiObj || apiObj.service !== 'API Gateway') {
      throw new Error(`REST API '${resourceName}' not found in amplify-meta.json`);
    }

    const cliInputs = gen1App.cliInputs('api', resourceName) as RestApiCliInputs | undefined;
    if (!cliInputs) {
      throw new Error(`Failed to read cli-inputs.json for REST API '${resourceName}'`);
    }

    const paths = cliInputs.paths ? parseRestApiPaths(cliInputs.paths) : [{ path: '/{proxy+}', methods: ['ANY'] }];

    const hasPathAuth = Object.values(cliInputs.paths || {}).some(
      (p) => p.permissions?.setting === 'private' || p.permissions?.setting === 'protected',
    );
    const authType = cliInputs.restrictAccess || hasPathAuth ? cliInputs.authType || 'AWS_IAM' : undefined;

    const dependsOn = (apiObj.dependsOn ?? []) as Array<{ category: string; resourceName: string }>;
    const defaultFunctionName = dependsOn.find((dep) => dep.category === 'function')?.resourceName;

    const output = (apiObj.output ?? {}) as Record<string, string>;
    const gen1ApiId = output.ApiId;
    if (!gen1ApiId) {
      throw new Error(`REST API '${resourceName}' has no ApiId in amplify-meta.json output`);
    }
    const gen1RootResourceId = await gen1App.aws.fetchRestApiRootResourceId(gen1ApiId);

    return {
      apiName: resourceName,
      functionName: defaultFunctionName || 'defaultFunction',
      paths,
      authType,
      corsConfiguration: cliInputs.corsConfiguration,
      uniqueFunctions: collectUniqueFunctions(paths, defaultFunctionName),
      gen1ApiId,
      gen1RootResourceId,
    };
  }
}

interface RestApiCliInputs {
  readonly paths?: Record<string, RestApiPathConfig>;
  readonly corsConfiguration?: CorsConfiguration;
  readonly restrictAccess?: boolean;
  readonly authType?: string;
}

interface RestApiPathConfig {
  readonly methods?: readonly string[];
  readonly permissions?: {
    readonly setting?: 'private' | 'protected' | 'open';
    readonly auth?: readonly string[];
    readonly groups?: Readonly<Record<string, readonly string[]>>;
  };
  readonly lambdaFunction?: string;
  readonly restrictAccess?: boolean;
  readonly groupAccess?: readonly string[];
}

function parseRestApiPaths(paths: Record<string, RestApiPathConfig>): RestApiPath[] {
  return Object.entries(paths).map(([pathName, pathConfig]) => {
    const pathAuthType = pathConfig.permissions?.setting || 'open';
    const userPoolGroups = pathConfig.permissions?.groups ? Object.keys(pathConfig.permissions.groups) : undefined;

    const permissions: { hasAuth?: boolean; groups?: Readonly<Record<string, readonly string[]>> } = {};
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
  });
}

function collectUniqueFunctions(paths: readonly RestApiPath[], defaultFunctionName?: string): string[] {
  const uniqueFunctions = new Set<string>();
  if (defaultFunctionName) {
    uniqueFunctions.add(defaultFunctionName);
  }
  for (const p of paths) {
    if (p.lambdaFunction) {
      uniqueFunctions.add(p.lambdaFunction);
    }
  }
  return Array.from(uniqueFunctions);
}

function extractMethodsFromPath(pathConfig: {
  readonly methods?: readonly string[];
  readonly permissions?: { readonly auth?: readonly string[]; readonly groups?: Readonly<Record<string, readonly string[]>> };
}): string[] {
  if (pathConfig.methods && pathConfig.methods.length > 0) {
    return [...pathConfig.methods];
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

function mapPermissionsToMethods(permissions: readonly string[]): string[] {
  const methodMap: Record<string, string> = {
    read: 'GET',
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE',
  };

  const methods = permissions.map((p) => methodMap[p]).filter((m): m is string => m !== undefined);

  return methods.length > 0 ? methods : ['GET'];
}
