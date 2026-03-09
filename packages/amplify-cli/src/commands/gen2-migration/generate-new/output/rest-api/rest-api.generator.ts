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
  private readonly defineRestApi: RestApiRenderer;
  private readonly functionNames: ReadonlySet<string>;

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, hasAuth: boolean, functionNames: ReadonlySet<string>) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.functionNames = functionNames;
    this.defineRestApi = new RestApiRenderer(hasAuth, functionNames);
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

    return [
      {
        describe: async () => restApis.map((api) => `Generate REST API CDK constructs for ${api.apiName}`),
        execute: async () => {
          this.addRestApiImports();
          this.addFunctionImports(restApis);

          const statements = this.defineRestApi.render(restApis);
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
  private addFunctionImports(restApis: readonly RestApiDefinition[]): void {
    const allUniqueFunctions = new Set<string>();
    for (const restApi of restApis) {
      if (restApi.uniqueFunctions) {
        for (const funcName of restApi.uniqueFunctions) {
          allUniqueFunctions.add(funcName);
        }
      }
    }

    for (const funcName of allUniqueFunctions) {
      if (this.functionNames.has(funcName)) {
        continue;
      }
      this.backendGenerator.addImport(`./function/${funcName}/resource`, [funcName]);
      this.backendGenerator.addDefineBackendProperty(factory.createShorthandPropertyAssignment(factory.createIdentifier(funcName)));
    }
  }
}
