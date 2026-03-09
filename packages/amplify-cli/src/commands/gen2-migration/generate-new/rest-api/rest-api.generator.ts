import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App } from '../gen1-app/gen1-app';
import { readRestApis, RestApiDefinition } from './rest-api-reader';

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

    const restApis = await readRestApis(apiCategory);
    if (restApis.length === 0) {
      return [];
    }

    return [
      {
        describe: async () => restApis.map((api) => `Generate REST API CDK constructs for ${api.apiName}`),
        execute: async () => {
          // REST API CDK imports
          this.backendGenerator.addImport('aws-cdk-lib/aws-apigateway', [
            'RestApi',
            'LambdaIntegration',
            'AuthorizationType',
            'Cors',
            'ResponseType',
          ]);
          this.backendGenerator.addImport('aws-cdk-lib/aws-iam', ['Policy', 'PolicyStatement']);
          this.backendGenerator.addImport('aws-cdk-lib', ['Stack']);

          // The actual CDK statement generation for REST APIs is complex
          // (stacks, gateway responses, Lambda integrations, IAM policies,
          // resource trees, proxy routes). This will be migrated from
          // BackendSynthesizer.render() in Phase 3 when we wire everything
          // together and can validate against snapshot tests.
          //
          // For now, the REST API definitions are available via readRestApis()
          // and the imports are registered with BackendGenerator.
        },
      },
    ];
  }
}
