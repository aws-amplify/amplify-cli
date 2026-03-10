import ts from 'typescript';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../../input/gen1-app';
import { RestApiRenderer } from './rest-api.renderer';

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
    const apiCategory = await this.gen1App.fetchMetaCategory('api');
    if (!apiCategory) return [];

    const restApis = await this.gen1App.fetchRestApiConfigs(Object.fromEntries([[this.resourceName, apiCategory[this.resourceName]]]));
    if (restApis.length === 0) return [];

    const restApi = restApis[0];
    const functionNames = await this.gen1App.fetchFunctionNames();
    const hasAuth = (await this.gen1App.fetchMetaCategory('auth')) !== undefined;
    const renderer = new RestApiRenderer(hasAuth, functionNames);

    return [
      {
        describe: async () => [`Generate REST API ${restApi.apiName}`],
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
  private addFunctionImports(restApi: { readonly uniqueFunctions?: string[] }, functionNames: ReadonlySet<string>): void {
    if (!restApi.uniqueFunctions) return;

    for (const funcName of restApi.uniqueFunctions) {
      if (functionNames.has(funcName)) continue;
      this.backendGenerator.addImport(`./function/${funcName}/resource`, [funcName]);
      this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier(funcName)));
    }
  }
}
