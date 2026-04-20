import path from 'node:path';
import fs from 'node:fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import CFNConditionResolver from './cfn-condition-resolver';
import { DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import { Planner } from '../../../_infra/planner';
import { AmplifyMigrationOperation } from '../../../_infra/operation';
import { BackendGenerator } from '../backend.generator';
import { Gen1App, DiscoveredResource } from '../../_infra/gen1-app';
import { TS } from '../../_infra/ts';
import { AnalyticsRenderer } from './kinesis.renderer';

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
    this.renderer = new AnalyticsRenderer();
  }

  /** Plans the Kinesis analytics generation operation. */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const analyticsCategory = this.gen1App.meta('analytics');
    const resourceMeta = analyticsCategory?.[this.resource.resourceName] as Record<string, unknown> | undefined;
    if (!resourceMeta) {
      throw new Error(`Analytics resource '${this.resource.resourceName}' not found in amplify-meta.json`);
    }

    const analyticsDir = path.join(this.outputDir, 'amplify', 'analytics');
    const logicalId = (resourceMeta.providerMetadata as { logicalId: string }).logicalId;

    return [
      {
        resource: this.resource,
        validate: () => undefined,
        describe: async () => [`Generate amplify/analytics/${this.resource.resourceName}/resource.ts`],
        execute: async () => {
          const resourceName = this.resource.resourceName;
          const template = this.gen1App.json(`analytics/${resourceName}/kinesis-cloudformation-template.json`);

          const constructFileName = `${resourceName}-construct`;
          const constructFilePath = path.join(this.outputDir, 'amplify', 'analytics', `${constructFileName}.ts`);

          const parameters = await this.getNestedStackParameters(logicalId);
          const shardCountParam = parameters.find((p) => p.ParameterKey === 'kinesisStreamShardCount');
          if (!shardCountParam?.ParameterValue) {
            throw new Error(`kinesisStreamShardCount parameter not found for nested stack with logical ID: ${logicalId}`);
          }
          const shardCount = parseInt(shardCountParam.ParameterValue, 10);

          const streamName = await this.getNestedStackResourcePhysicalId(logicalId, 'KinesisStream');
          if (!streamName) {
            throw new Error(`Could not find physical stream name for KinesisStream in nested stack: ${logicalId}`);
          }

          const finalTemplate = await this.preTransmute(template, logicalId);
          const tsFile = cdk_from_cfn.transmute(JSON.stringify(finalTemplate), 'typescript', logicalId, 'construct');

          const prettier = await import('prettier');
          const formatted = prettier.format(tsFile, {
            parser: 'typescript',
            singleQuote: true,
            tabWidth: 2,
            printWidth: 80,
          });
          await fs.mkdir(path.dirname(constructFilePath), { recursive: true });
          await fs.writeFile(constructFilePath, formatted, 'utf-8');

          const classNameMatch = tsFile.match(/export class (\w+) extends/);
          const constructClassName = classNameMatch ? classNameMatch[1] : `analytics${resourceName}`;

          const nodes = this.renderer.render({
            constructClassName,
            constructFileName,
            resourceName,
            shardCount,
            streamName,
          });

          const content = TS.printNodes(nodes);

          await fs.mkdir(analyticsDir, { recursive: true });
          await fs.writeFile(path.join(analyticsDir, 'resource.ts'), content, 'utf-8');

          this.backendGenerator.addNamespaceImport('analytics', './analytics/resource');
          this.backendGenerator.addPostDefineCall('analyticsResult', `analytics.defineAnalytics(backend)`);
          this.backendGenerator.setAnalyticsResultVar('analyticsResult');
          this.backendGenerator.addAnalyticsResultAlias('analytics');
          this.backendGenerator.addPostRefactorCall(`analytics.postRefactor(analyticsResult);`);
        },
      },
    ];
  }

  private async getNestedStackPhysicalName(logicalId: string): Promise<string | undefined> {
    const cfnClient = this.gen1App.clients.cloudFormation;
    const rootStackName = this.gen1App.rootStackName;
    if (!cfnClient || !rootStackName) return undefined;

    const response = await cfnClient.send(new DescribeStackResourcesCommand({ StackName: rootStackName, LogicalResourceId: logicalId }));
    return response.StackResources?.[0]?.PhysicalResourceId;
  }

  private async getNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    const cfnClient = this.gen1App.clients.cloudFormation;
    const rootStackName = this.gen1App.rootStackName;
    if (!cfnClient || !rootStackName) return [];

    const nestedStackName = await this.getNestedStackPhysicalName(logicalId);
    if (!nestedStackName) return [];

    const response = await cfnClient.send(new DescribeStacksCommand({ StackName: nestedStackName }));
    return response.Stacks?.[0]?.Parameters ?? [];
  }

  private async getNestedStackResourcePhysicalId(nestedStackLogicalId: string, resourceLogicalId: string): Promise<string | undefined> {
    const cfnClient = this.gen1App.clients.cloudFormation;
    const rootStackName = this.gen1App.rootStackName;
    if (!cfnClient || !rootStackName) return undefined;

    const nestedStackName = await this.getNestedStackPhysicalName(nestedStackLogicalId);
    if (!nestedStackName) return undefined;

    const response = await cfnClient.send(
      new DescribeStackResourcesCommand({ StackName: nestedStackName, LogicalResourceId: resourceLogicalId }),
    );
    return response.StackResources?.[0]?.PhysicalResourceId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async preTransmute(template: any, logicalId: string): Promise<any> {
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

    const parameters = await this.getNestedStackParameters(logicalId);
    if (parameters.length > 0) {
      const resolved = new CFNConditionResolver(result).resolve(parameters);
      delete resolved.Conditions;
      return resolved;
    }

    return result;
  }
}
