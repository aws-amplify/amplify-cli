import path from 'node:path';
import fs from 'node:fs/promises';
import * as cdkFromCfn from 'cdk-from-cfn';
import { resolveConditions } from '../../../refactor/resolvers/cfn-condition-resolver';
import { DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { Planner } from '../../../_common/planner';
import { AmplifyMigrationOperation } from '../../../_common/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../../_common/gen1-app';
import { TS } from '../../ts';
import { AnalyticsRenderer } from './kinesis.renderer';
import * as prettier from 'prettier';
import { SpinningLogger } from '../../../_common/spinning-logger';

// e.g `const analyticsResult = definedAnalytics(...)`
// an exported constant because the function generator needs this as well
// to instruct backend.ts to pass this variable to the applyEscapeHatch call.
export const DEFINE_ANALYTICS_VARIABLE_NAME = 'analyticsResult';

/**
 * Generates a single Kinesis analytics resource and contributes to backend.ts.
 *
 * Converts the CloudFormation template to CDK using cdk-from-cfn,
 * generates analytics/resource.ts, and adds the analytics import
 * and call to backend.ts.
 */
export class AnalyticsKinesisGenerator implements Planner {
  private readonly gen1App: Gen1App;
  private readonly backendGenerator: BackendGenerator;
  private readonly outputDir: string;
  private readonly resource: DiscoveredResource;
  private readonly renderer: AnalyticsRenderer;
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
    this.renderer = new AnalyticsRenderer(resource);
    this.logger = logger;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const resourceMeta = this.gen1App.resourceMeta(this.resource);
    const logicalId = resourceMeta.providerMetadata.logicalId;

    const resourceName = this.resource.resourceName;
    const constructFileName = AnalyticsKinesisGenerator.fileName(resourceName);
    const constructClassName = AnalyticsKinesisGenerator.className(resourceName);
    const constructFilePath = path.join(this.outputDir, 'amplify', 'analytics', `${constructFileName}.ts`);
    const analyticsDir = path.join(this.outputDir, 'amplify', 'analytics');

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/analytics/${constructFileName}.ts`],
        execute: async () => {
          const template = this.gen1App.json(`analytics/${resourceName}/kinesis-cloudformation-template.json`);
          const parameters = await this.fetchNestedStackParameters(logicalId);
          const finalTemplate = await preTransmute(template, parameters);
          const tsFile = cdkFromCfn.transmute(JSON.stringify(finalTemplate), 'typescript', constructClassName, 'construct');
          const formatted = prettier.format(tsFile, {
            parser: 'typescript',
            singleQuote: true,
            tabWidth: 2,
            printWidth: 80,
          });
          this.logger.info(`Rendering analytics/${constructFileName}.ts`);
          await fs.mkdir(path.dirname(constructFilePath), { recursive: true });
          await fs.writeFile(constructFilePath, formatted, 'utf-8');
        },
      },
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/analytics/resource.ts`],
        execute: async () => {
          const shardCount = parseInt(this.gen1App.resourceMetaOutput(this.resource, 'kinesisStreamShardCount'), 10);
          const streamName = this.gen1App.resourceMetaOutput(this.resource, 'kinesisStreamId');

          this.logger.info('Rendering analytics/resource.ts');
          const nodes = this.renderer.render({
            constructClassName,
            constructFileName,
            shardCount,
            streamName,
          });

          const content = TS.printNodes(nodes);

          await fs.mkdir(analyticsDir, { recursive: true });
          await fs.writeFile(path.join(analyticsDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('analytics', './analytics/resource');
          this.backendGenerator.addPostDefineBackendCall(DEFINE_ANALYTICS_VARIABLE_NAME, `analytics.defineAnalytics(backend)`);
          this.backendGenerator.addPostRefactorCall(`analytics.postRefactor(${DEFINE_ANALYTICS_VARIABLE_NAME});`);
        },
      },
    ];
  }

  public static className(resourceName: string): string {
    return resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  }

  public static fileName(resourceName: string): string {
    return `${resourceName}-construct`.toLowerCase();
  }

  private async fetchNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    this.logger.debug(`Fetching nested stack parameters for '${logicalId}'`);
    const nestedStackName = await this.gen1App.aws.findResourcePhysicalId(this.gen1App.rootStackName, logicalId);
    if (!nestedStackName) {
      throw new AmplifyError('NestedStackNotFoundError', {
        message: `Nested stack not found for logical ID '${logicalId}' in stack '${this.gen1App.rootStackName}'`,
        resolution: 'Verify the CloudFormation stack exists and has not been manually modified.',
      });
    }

    const stacksResponse = await this.gen1App.clients.cloudFormation.send(new DescribeStacksCommand({ StackName: nestedStackName }));
    return stacksResponse.Stacks?.[0]?.Parameters ?? [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function preTransmute(template: any, parameters: Parameter[]): Promise<any> {
  const result = JSON.parse(JSON.stringify(template));

  if (result.Parameters?.env) {
    result.Parameters['branchName'] = result.Parameters.env;
    delete result.Parameters.env;
  }

  const updateRefs = (obj: unknown): void => {
    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>;
      if (record.Ref === 'env') {
        record.Ref = 'branchName';
      }
      Object.values(record).forEach(updateRefs);
    }
  };
  updateRefs(result.Resources);

  if (parameters.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolved = resolveConditions(result, parameters) as any;
    delete resolved.Conditions;
    return resolved;
  }

  return result;
}
