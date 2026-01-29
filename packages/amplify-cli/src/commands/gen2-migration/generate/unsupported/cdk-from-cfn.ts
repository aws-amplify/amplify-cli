import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import { CFNTemplate } from '../../refactor/types';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import CFNConditionResolver from '../../refactor/resolvers/cfn-condition-resolver';

/**
 * Definition for Kinesis Analytics resource from Gen1 amplify-meta.json
 */
export interface KinesisAnalyticsDefinition {
  /** Resource name - set by migration-pipeline.ts from the analytics key */
  name?: string;
  /** Service type - Kinesis or Pinpoint */
  service: 'Kinesis' | 'Pinpoint';
  /** Provider metadata containing S3 template URL and logical ID */
  providerMetadata: {
    s3TemplateURL: string;
    logicalId: string;
  };
}

/**
 * Result of analytics codegen containing metadata needed for resource.ts generation
 */
export interface AnalyticsCodegenResult {
  /** The class name of the generated construct (extracted from generated code) */
  constructClassName: string;
  /** The file name of the generated construct without extension */
  constructFileName: string;
  /** The resource name used for construct ID and props */
  resourceName: string;
  /** The number of shards for the Kinesis stream */
  shardCount: number;
  /** The actual deployed Kinesis stream name from Gen1 */
  streamName: string;
}

export class CdkFromCfn {
  public constructor(
    private readonly dir: string,
    private readonly fileWriter: (content: string, filePath: string) => Promise<void>,
    private readonly cfnClient?: CloudFormationClient,
    private readonly rootStackName?: string,
  ) {}

  /**
   * Gets the physical stack name for a nested stack by looking up its physical resource ID
   * from the root stack.
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
   * Gets the parameters for a nested stack by looking up its physical resource ID
   * from the root stack and then describing that stack.
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

      // Describe the nested stack to get its parameters
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

  public async generateKinesisAnalyticsL1Code(definition: KinesisAnalyticsDefinition): Promise<AnalyticsCodegenResult> {
    const resourceName = definition.name ?? 'kinesis';
    const constructFileName = `${resourceName}-construct`;
    const filePath = path.join(this.dir, 'amplify', 'analytics', `${constructFileName}.ts`);
    const templateS3Url = definition.providerMetadata.s3TemplateURL;
    const template = await getCfnTemplateFromS3(templateS3Url);
    const nestedStackLogicalId = definition.providerMetadata.logicalId;

    // Get shardCount from deployed stack parameters
    const parameters = await this.getNestedStackParameters(nestedStackLogicalId);
    const shardCountParam = parameters.find((p) => p.ParameterKey === 'kinesisStreamShardCount');
    if (!shardCountParam?.ParameterValue) {
      throw new Error(`kinesisStreamShardCount parameter not found for nested stack with logical ID: ${nestedStackLogicalId}`);
    }
    const shardCount = parseInt(shardCountParam.ParameterValue, 10);

    // Get the actual deployed Kinesis stream name (physical resource ID)
    const streamName = await this.getNestedStackResourcePhysicalId(nestedStackLogicalId, 'KinesisStream');
    if (!streamName) {
      throw new Error(`Could not find physical stream name for KinesisStream in nested stack: ${nestedStackLogicalId}`);
    }

    const finalTemplate = await this.preTransmute(template, nestedStackLogicalId);
    const tsFile = cdk_from_cfn.transmute(JSON.stringify(finalTemplate), 'typescript', nestedStackLogicalId, 'construct');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await this.fileWriter(tsFile, filePath);

    // Extract the class name from the generated code
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

  private async preTransmute(template: CFNTemplate, logicalId: string): Promise<CFNTemplate> {
    // Rename "env" parameter to "branchName"
    if (template.Parameters?.env) {
      template.Parameters['branchName'] = template.Parameters.env;
      delete template.Parameters.env;
    }

    // Update all Ref references from "env" to "branchName"
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

    // Resolve CFN conditions using deployed stack parameters
    // This is critical because cdk-from-cfn generates broken TypeScript for CFN conditions
    // (e.g., `const shouldNotCreateEnvResources = props.env! === 'NONE';` which is invalid syntax)
    const parameters = await this.getNestedStackParameters(logicalId);
    if (parameters.length > 0) {
      const resolved = new CFNConditionResolver(template).resolve(parameters);
      // Delete the Conditions block after resolution - cdk-from-cfn generates broken code for conditions
      // All Fn::If references have been resolved, and resources with unmet conditions have been removed
      delete resolved.Conditions;
      return resolved;
    }

    return template;
  }
}

async function getCfnTemplateFromS3(s3Url: string): Promise<CFNTemplate> {
  const url = new URL(s3Url);
  let bucket: string;
  let key: string;

  // Check if virtual-hosted style (bucket in hostname)
  // e.g., https://my-bucket.s3.us-east-1.amazonaws.com/key/path
  const virtualHostMatch = url.hostname.match(/^(.+)\.s3[.-].*\.amazonaws\.com$/);

  if (virtualHostMatch) {
    bucket = virtualHostMatch[1];
    key = url.pathname.slice(1); // remove leading '/'
  } else {
    // Path-style: https://s3.region.amazonaws.com/bucket/key/path
    const splitPath = url.pathname.split('/');
    bucket = splitPath[1];
    key = splitPath.slice(2).join('/');
  }

  const s3Client = new S3Client({});
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error(`Failed to retrieve S3 object: ${s3Url}`);
  }
  return JSON.parse(await response.Body.transformToString()) as CFNTemplate;
}
