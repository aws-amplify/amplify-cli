import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import CFNConditionResolver from './cfn-condition-resolver';
import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';

/**
 * Result of analytics codegen containing metadata needed for resource.ts generation.
 */
export interface AnalyticsCodegenResult {
  /**
   * The class name of the generated construct (extracted from generated code).
   */
  readonly constructClassName: string;

  /**
   * The file name of the generated construct without extension.
   */
  readonly constructFileName: string;

  /**
   * The resource name used for construct ID and props.
   */
  readonly resourceName: string;

  /**
   * The number of shards for the Kinesis stream.
   */
  readonly shardCount: number;

  /**
   * The actual deployed Kinesis stream name from Gen1.
   */
  readonly streamName: string;
}

/**
 * Converts Kinesis CloudFormation templates to CDK constructs using cdk-from-cfn.
 *
 * Fetches the nested stack's CFN template from S3, resolves conditions
 * using deployed stack parameters, and runs the cdk-from-cfn
 * to produce a TypeScript CDK construct file.
 */
export class KinesisCfnConverter {
  private readonly dir: string;
  private readonly fileWriter: (content: string, filePath: string) => Promise<void>;
  private readonly cfnClient?: CloudFormationClient;
  private readonly rootStackName?: string;

  public constructor(
    dir: string,
    fileWriter: (content: string, filePath: string) => Promise<void>,
    cfnClient?: CloudFormationClient,
    rootStackName?: string,
  ) {
    this.dir = dir;
    this.fileWriter = fileWriter;
    this.cfnClient = cfnClient;
    this.rootStackName = rootStackName;
  }

  /**
   * Converts a Kinesis analytics CloudFormation template to a CDK L1 construct.
   *
   * Downloads the template from S3, resolves CFN conditions using deployed
   * parameters, runs cdk-from-cfn, and writes the generated construct file.
   */
  public async generateKinesisAnalyticsL1Code(
    resourceName: string,
    nestedStackLogicalId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    template: any,
  ): Promise<AnalyticsCodegenResult> {
    const constructFileName = `${resourceName}-construct`;
    const filePath = path.join(this.dir, 'amplify', 'analytics', `${constructFileName}.ts`);

    const parameters = await this.getNestedStackParameters(nestedStackLogicalId);
    const shardCountParam = parameters.find((p) => p.ParameterKey === 'kinesisStreamShardCount');
    if (!shardCountParam?.ParameterValue) {
      throw new Error(`kinesisStreamShardCount parameter not found for nested stack with logical ID: ${nestedStackLogicalId}`);
    }
    const shardCount = parseInt(shardCountParam.ParameterValue, 10);

    const streamName = await this.getNestedStackResourcePhysicalId(nestedStackLogicalId, 'KinesisStream');
    if (!streamName) {
      throw new Error(`Could not find physical stream name for KinesisStream in nested stack: ${nestedStackLogicalId}`);
    }

    const finalTemplate = await this.preTransmute(template, nestedStackLogicalId);
    const tsFile = cdk_from_cfn.transmute(JSON.stringify(finalTemplate), 'typescript', nestedStackLogicalId, 'construct');
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Format with prettier to match the expected output style (printWidth: 80)
    const prettier = await import('prettier');
    const formatted = prettier.format(tsFile, {
      parser: 'typescript',
      singleQuote: true,
      tabWidth: 2,
      printWidth: 80,
    });
    await this.fileWriter(formatted, filePath);

    const classNameMatch = tsFile.match(/export class (\w+) extends/);
    const constructClassName = classNameMatch ? classNameMatch[1] : `analytics${resourceName}`;

    return {
      constructClassName,
      constructFileName,
      resourceName,
      shardCount,
      streamName,
    };
  }

  /**
   * Gets the physical stack name for a nested stack by looking up its
   * physical resource ID from the root stack.
   *
   * Returns undefined if the CFN client is unavailable.
   */
  private async getNestedStackPhysicalName(logicalId: string): Promise<string | undefined> {
    if (!this.cfnClient || !this.rootStackName) {
      return undefined;
    }

    try {
      const describeResourcesResponse = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: this.rootStackName,
          LogicalResourceId: logicalId,
        }),
      );

      return describeResourcesResponse.StackResources?.[0]?.PhysicalResourceId;
    } catch (e) {
      throw new Error(`Failed to describe CloudFormation stack resources: ${e}`);
    }
  }

  /**
   * Gets the parameters for a nested stack by resolving its physical
   * resource ID from the root stack and then describing that stack.
   *
   * Returns an empty array if the CFN client is unavailable.
   */
  private async getNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    if (!this.cfnClient || !this.rootStackName) {
      return [];
    }

    try {
      const nestedStackName = await this.getNestedStackPhysicalName(logicalId);
      if (!nestedStackName) {
        return [];
      }

      const describeStacksResponse = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: nestedStackName,
        }),
      );

      return describeStacksResponse.Stacks?.[0]?.Parameters ?? [];
    } catch (e) {
      throw new Error(`Failed to describe CloudFormation stack resources: ${e}`);
    }
  }

  /**
   * Gets the physical resource ID of a resource within a nested stack.
   *
   * Returns undefined if the CFN client is unavailable.
   */
  private async getNestedStackResourcePhysicalId(nestedStackLogicalId: string, resourceLogicalId: string): Promise<string | undefined> {
    if (!this.cfnClient || !this.rootStackName) {
      return undefined;
    }

    try {
      const nestedStackName = await this.getNestedStackPhysicalName(nestedStackLogicalId);
      if (!nestedStackName) {
        return undefined;
      }

      const describeResourcesResponse = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: nestedStackName,
          LogicalResourceId: resourceLogicalId,
        }),
      );

      return describeResourcesResponse.StackResources?.[0]?.PhysicalResourceId;
    } catch (e) {
      throw new Error(`Failed to describe CloudFormation stack resources: ${e}`);
    }
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
