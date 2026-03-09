import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import { CFNTemplate } from '../../refactor/types';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import CFNConditionResolver from '../../refactor/resolvers/cfn-condition-resolver';

/**
 * Definition for Kinesis Analytics resource from Gen1 amplify-meta.json.
 */
export interface KinesisAnalyticsDefinition {
  /**
   * Resource name — set by the analytics generator from the meta key.
   */
  name?: string;

  /**
   * Service type — Kinesis or Pinpoint.
   */
  readonly service: 'Kinesis' | 'Pinpoint';

  /**
   * Provider metadata containing S3 template URL and logical ID.
   */
  readonly providerMetadata: {
    readonly s3TemplateURL: string;
    readonly logicalId: string;
  };
}

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
 * using deployed stack parameters, and runs the cdk-from-cfn transmuter
 * to produce a TypeScript CDK construct file.
 */
export class KinesisCfnConverter {
  private readonly dir: string;
  private readonly fileWriter: (content: string, filePath: string) => Promise<void>;
  private readonly cfnClient?: CloudFormationClient;
  private readonly rootStackName?: string;
  private readonly s3Client: S3Client;

  public constructor(
    dir: string,
    fileWriter: (content: string, filePath: string) => Promise<void>,
    s3Client: S3Client,
    cfnClient?: CloudFormationClient,
    rootStackName?: string,
  ) {
    this.dir = dir;
    this.fileWriter = fileWriter;
    this.s3Client = s3Client;
    this.cfnClient = cfnClient;
    this.rootStackName = rootStackName;
  }

  /**
   * Converts a Kinesis analytics CloudFormation template to a CDK L1 construct.
   *
   * Downloads the template from S3, resolves CFN conditions using deployed
   * parameters, runs cdk-from-cfn, and writes the generated construct file.
   */
  public async generateKinesisAnalyticsL1Code(definition: KinesisAnalyticsDefinition): Promise<AnalyticsCodegenResult> {
    const resourceName = definition.name ?? 'kinesis';
    const constructFileName = `${resourceName}-construct`;
    const filePath = path.join(this.dir, 'amplify', 'analytics', `${constructFileName}.ts`);
    const templateS3Url = definition.providerMetadata.s3TemplateURL;
    const template = await getCfnTemplateFromS3(templateS3Url, this.s3Client);
    const nestedStackLogicalId = definition.providerMetadata.logicalId;

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
    await this.fileWriter(tsFile, filePath);

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
    } catch (error) {
      console.log(`Error getting nested stack physical name: ${error}`);
      return undefined;
    }
  }

  /**
   * Gets the parameters for a nested stack by resolving its physical
   * resource ID from the root stack and then describing that stack.
   */
  private async getNestedStackParameters(logicalId: string): Promise<Parameter[]> {
    if (!this.cfnClient || !this.rootStackName) {
      return [];
    }

    try {
      const nestedStackName = await this.getNestedStackPhysicalName(logicalId);
      if (!nestedStackName) {
        console.log(`Could not find physical resource ID for nested stack: ${logicalId}`);
        return [];
      }

      const describeStacksResponse = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: nestedStackName,
        }),
      );

      return describeStacksResponse.Stacks?.[0]?.Parameters ?? [];
    } catch (error) {
      console.log(`Error getting nested stack parameters: ${error}`);
      return [];
    }
  }

  /**
   * Gets the physical resource ID of a resource within a nested stack.
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
    } catch (error) {
      console.log(`Error getting nested stack resource physical ID: ${error}`);
      return undefined;
    }
  }

  private async preTransmute(template: CFNTemplate, logicalId: string): Promise<CFNTemplate> {
    if (template.Parameters?.env) {
      template.Parameters['branchName'] = template.Parameters.env;
      delete template.Parameters.env;
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

    updateRefs(template.Resources);

    const parameters = await this.getNestedStackParameters(logicalId);
    if (parameters.length > 0) {
      const resolved = new CFNConditionResolver(template).resolve(parameters);
      delete resolved.Conditions;
      return resolved;
    }

    return template;
  }
}

/**
 * Downloads a CloudFormation template from S3 given its URL.
 */
async function getCfnTemplateFromS3(s3Url: string, s3Client: S3Client): Promise<CFNTemplate> {
  const url = new URL(s3Url);
  let bucket: string;
  let key: string;

  const virtualHostMatch = url.hostname.match(/^(.+)\.s3[.-].*\.amazonaws\.com$/);

  if (virtualHostMatch) {
    bucket = virtualHostMatch[1];
    key = url.pathname.slice(1);
  } else {
    const splitPath = url.pathname.split('/');
    bucket = splitPath[1];
    key = splitPath.slice(2).join('/');
  }

  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error(`Failed to retrieve S3 object: ${s3Url}`);
  }
  return JSON.parse(await response.Body.transformToString()) as CFNTemplate;
}
