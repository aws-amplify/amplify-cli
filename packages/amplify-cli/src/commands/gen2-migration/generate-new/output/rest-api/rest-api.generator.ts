import ts from 'typescript';
import { Generator } from '../../generator';
import { AmplifyMigrationOperation } from '../../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, RestApiDefinition } from '../../input/gen1-app';
import { RestApiRenderer } from './rest-api.renderer';

const factory = ts.factory;

/**
 * Generates REST API (API Gateway) resources and contributes CDK
 * constructs to backend.ts.
 *
 * REST APIs in Gen1 are backed by API Gateway + Lambda. In Gen2,
 * they're generated as CDK constructs directly in backend.ts
 * (there's no defineRestApi() equivalent in the Amplify backend
 * library). Each REST API gets its own CloudFormation stack with
 * a RestApi, LambdaIntegration, and IAM policies.
 *
 * This generator reads the REST API configuration from the local
 * Gen1 project's cli-inputs.json files and contributes the CDK
 * statements to BackendGenerator.
 */
export class RestApiGenerator implements Generator {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
  }

  /**
   * Plans the REST API generation operations.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const apiCategory = await this.gen1App.fetchMetaCategory('api');
    if (!apiCategory) {
      return [];
    }

    const restApis = await this.gen1App.fetchRestApiConfigs(apiCategory);
    if (restApis.length === 0) {
      return [];
    }

    const functionNames = await this.gen1App.fetchFunctionNames();
    const hasAuth = (await this.gen1App.fetchMetaCategory('auth')) !== undefined;
    const defineRestApi = new RestApiRenderer(hasAuth, functionNames);

    return [
      {
        describe: async () => restApis.map((api) => `Generate REST API CDK constructs for ${api.apiName}`),
        execute: async () => {
          this.addRestApiImports();
          await this.addFunctionImports(restApis);

          this.backendGenerator.ensureBranchName();
          const statements = defineRestApi.render(restApis);
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
   * Adds function imports and defineBackend properties for unique
   * functions used by REST APIs that aren't already registered
   * by the main function generator.
   */
  private async addFunctionImports(restApis: readonly RestApiDefinition[]): Promise<void> {
    const allUniqueFunctions = new Set<string>();
    for (const restApi of restApis) {
      if (restApi.uniqueFunctions) {
        for (const funcName of restApi.uniqueFunctions) {
          allUniqueFunctions.add(funcName);
        }
      }
    }

    const functionNames = await this.gen1App.fetchFunctionNames();
    for (const funcName of allUniqueFunctions) {
      if (functionNames.has(funcName)) {
        continue;
      }
      this.backendGenerator.addImport(`./function/${funcName}/resource`, [funcName]);
      this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier(funcName)));
    }
  }
}
