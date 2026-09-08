import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { RestApiRenderOptions, RestApiRenderer } from './rest-api.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

interface ResourceDependency {
  readonly category: string;
  readonly resourceName: string;
  readonly attributes?: readonly string[];
}

interface AdminQueriesConfig {
  readonly authResourceName: string;
  readonly functionNames: readonly string[];
}

/**
 * Generates a single REST API (API Gateway) resource and contributes
 * CDK constructs to backend.ts.
 *
 * REST APIs in Gen1 are backed by API Gateway + Lambda. In Gen2,
 * they're generated as CDK constructs directly in backend.ts.
 * Each REST API gets its own CloudFormation stack with a RestApi,
 * LambdaIntegration, and IAM policies.
 */
export class RestApiGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly resource: DiscoveredResource;
  private readonly outputDir: string;
  private readonly logger: SpinningLogger;

  public constructor(
    gen1App: Gen1App,
    backendGenerator: BackendGenerator,
    outputDir: string,
    resource: DiscoveredResource,
    logger: SpinningLogger,
  ) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.logger = logger;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const hasAuth = this.gen1App.categoryMeta('auth') !== undefined;
    const restApi = await this.readRestApiConfig(hasAuth);

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/api/${restApi.apiName}/resource.ts`],
        execute: async () => {
          const apiDir = path.join(this.outputDir, 'amplify', 'api', restApi.apiName);
          const renderer = new RestApiRenderer(hasAuth);

          this.logger.info(`Rendering api/${restApi.apiName}/resource.ts`);
          const nodes = renderer.render(restApi);
          const content = TS.printNodes(nodes);

          await fs.mkdir(apiDir, { recursive: true });
          await fs.writeFile(path.join(apiDir, 'resource.ts'), content, 'utf-8');

          const alias = this.backendGenerator.reserveAlias(restApi.apiName, 'api');
          this.backendGenerator.addNamespaceImport(alias, `./api/${restApi.apiName}/resource`);
          this.backendGenerator.addPostDefineBackendStatement(`${alias}.${restApi.exportedFunctionName}(backend)`);
        },
      },
    ];
  }

  /**
   * Reads the REST API definition for a single API Gateway resource
   * from local cli-inputs.json and amplify-meta.json.
   */
  private async readRestApiConfig(hasAuth: boolean): Promise<RestApiRenderOptions> {
    const cliInputs = this.gen1App.cliInputs('api', this.resource.resourceName);
    const gen1ApiId = this.gen1App.resourceMetaOutput(this.resource, 'ApiId');
    this.logger.debug(`Fetching REST API root resource for '${gen1ApiId}'`);
    const gen1RootResourceId = await this.gen1App.aws.fetchRestApiRootResourceId(gen1ApiId);
    const paths = cliInputs.paths ?? {};
    const adminQueriesConfig = this.adminQueriesConfig(paths, hasAuth);
    return {
      apiName: this.resource.resourceName,
      exportedFunctionName: `define${this.resource.resourceName.charAt(0).toUpperCase() + this.resource.resourceName.slice(1)}Api`,
      paths,
      gen1ApiId,
      gen1RootResourceId,
      ...(adminQueriesConfig && {
        adminQueriesFunctionNames: adminQueriesConfig.functionNames,
        gen1UserPoolId: this.gen1UserPoolId(adminQueriesConfig.authResourceName),
      }),
    };
  }

  private adminQueriesConfig(
    paths: Record<string, { readonly lambdaFunction?: string }>,
    hasAuth: boolean,
  ): AdminQueriesConfig | undefined {
    if (this.resource.resourceName !== 'AdminQueries') {
      return undefined;
    }

    const rawDependencies = this.gen1App.resourceMeta(this.resource).dependsOn;
    const dependencies = (Array.isArray(rawDependencies) ? rawDependencies : []) as ResourceDependency[];
    const authDependency = dependencies.find(
      (dependency) => dependency.category === 'auth' && dependency.attributes?.includes('UserPoolId'),
    );
    const functionDependencies = new Set(
      dependencies
        .filter(
          (dependency) =>
            dependency.category === 'function' && dependency.attributes?.includes('Arn') && dependency.attributes.includes('Name'),
        )
        .map((dependency) => dependency.resourceName),
    );
    const functionNames = Array.from(
      new Set(
        Object.values(paths)
          .map((pathConfig) => pathConfig.lambdaFunction)
          .filter((name): name is string => !!name && functionDependencies.has(name)),
      ),
    );

    if (!authDependency || functionNames.length === 0) {
      return undefined;
    }

    const authCategory = this.gen1App.categoryMeta('auth');
    if (!hasAuth || !authCategory?.[authDependency.resourceName]) {
      this.logger.warn(
        `AdminQueries API '${this.resource.resourceName}' detected but its Cognito auth dependency ` +
          `'${authDependency.resourceName}' is missing from amplify-meta.json; generated API will not include AdminQueries auth wiring`,
      );
      return undefined;
    }

    return { authResourceName: authDependency.resourceName, functionNames };
  }

  private gen1UserPoolId(authResourceName: string): string | undefined {
    const authCategory = this.gen1App.categoryMeta('auth');
    const authResourceMeta = authCategory?.[authResourceName] as { readonly output?: { readonly UserPoolId?: string } } | undefined;
    const gen1UserPoolId = authResourceMeta?.output?.UserPoolId;
    if (!gen1UserPoolId) {
      this.logger.warn(
        `AdminQueries API '${this.resource.resourceName}' detected but no Gen1 Cognito UserPoolId was found for ` +
          `'${authResourceName}' in amplify-meta.json; generated IAM policy will scope to the Gen2 user pool only`,
      );
    }

    return gen1UserPoolId;
  }
}
