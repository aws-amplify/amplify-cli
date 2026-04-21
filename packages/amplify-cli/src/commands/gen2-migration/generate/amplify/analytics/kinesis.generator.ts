import path from 'node:path';
import fs from 'node:fs/promises';
import * as cdkFromCfn from 'cdk-from-cfn';
import { resolveConditions } from '../../../refactor/resolvers/cfn-condition-resolver';
import { DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { AnalyticsRenderer } from './kinesis.renderer';
import * as prettier from 'prettier';

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

  public constructor(gen1App: Gen1App, backendGenerator: BackendGenerator, outputDir: string, resource: DiscoveredResource) {
    this.gen1App = gen1App;
    this.backendGenerator = backendGenerator;
    this.outputDir = outputDir;
    this.resource = resource;
    this.renderer = new AnalyticsRenderer(resource);
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const resourceMeta = this.gen1App.resourceMeta(this.resource);
    const logicalId = resourceMeta.providerMetadata.logicalId;

    const resourceName = this.resource.resourceName;
    const constructFileName = `${resourceName}-construct`.toLowerCase();
    const constructClassName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
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
          this.backendGenerator.addPostDefineBackendCall('analyticsResult', `analytics.defineAnalytics(backend)`);
          this.backendGenerator.addPostRefactorCall(`analytics.postRefactor(analyticsResult);`);
        },
      },
    ];
  }

  private async fetchNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    const resourcesResponse = await this.gen1App.clients.cloudFormation.send(
      new DescribeStackResourcesCommand({ StackName: this.gen1App.rootStackName, LogicalResourceId: logicalId }),
    );
    const nestedStackName = resourcesResponse.StackResources?.[0]?.PhysicalResourceId;
    if (!nestedStackName) {
      throw new Error(`Nested stack not found for logical ID '${logicalId}' in stack '${this.gen1App.rootStackName}'`);
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
