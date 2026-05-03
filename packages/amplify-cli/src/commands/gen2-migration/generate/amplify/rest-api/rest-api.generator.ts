import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { RestApiRenderOptions, RestApiRenderer } from './rest-api.renderer';
import { SpinningLogger } from '../../../_common/spinning-logger';

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
    const restApi = await this.readRestApiConfig();
    const hasAuth = this.gen1App.categoryMeta('auth') !== undefined;

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

          const alias = restApi.apiName;
          this.backendGenerator.addNamespaceImport(alias, `./api/${alias}/resource`);
          this.backendGenerator.addPostDefineBackendStatement(`${alias}.${restApi.exportedFunctionName}(backend)`);
        },
      },
    ];
  }

  /**
   * Reads the REST API definition for a single API Gateway resource
   * from local cli-inputs.json and amplify-meta.json.
   */
  private async readRestApiConfig(): Promise<RestApiRenderOptions> {
    const cliInputs = this.gen1App.cliInputs('api', this.resource.resourceName);
    const gen1ApiId = this.gen1App.resourceMetaOutput(this.resource, 'ApiId');
    this.logger.debug(`Fetching REST API root resource for '${gen1ApiId}'`);
    const gen1RootResourceId = await this.gen1App.aws.fetchRestApiRootResourceId(gen1ApiId);
    return {
      apiName: this.resource.resourceName,
      exportedFunctionName: `define${this.resource.resourceName.charAt(0).toUpperCase() + this.resource.resourceName.slice(1)}Api`,
      paths: cliInputs.paths ?? {},
      gen1ApiId,
      gen1RootResourceId,
    };
  }
}
