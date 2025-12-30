import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import { CFNTemplate } from '../../../refactor/types';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand, Parameter } from '@aws-sdk/client-cloudformation';
import CFNConditionResolver from '../../../refactor/resolvers/cfn-condition-resolver';

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
  /** The class name of the generated stack (extracted from generated code) */
  stackClassName: string;
  /** The file name of the generated stack without extension */
  stackFileName: string;
  /** The resource name used for stack ID and props */
  resourceName: string;
}

export class CdkFromCfn {
  public constructor(
    private readonly dir: string,
    private readonly fileWriter: (content: string, filePath: string) => Promise<void>,
    private readonly cfnClient?: CloudFormationClient,
    private readonly rootStackName?: string,
  ) {}

  /**
   * Gets the parameters for a nested analytics stack by looking up its physical resource ID
   * from the root stack and then describing that stack.
   */
  private async getAnalyticsStackParameters(logicalId: string): Promise<Parameter[]> {
    if (!this.cfnClient || !this.rootStackName) {
      return [];
    }

    try {
      // Get the physical resource ID (actual stack name) from the root stack
      const describeResourcesResponse = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: this.rootStackName,
          LogicalResourceId: logicalId,
        }),
      );

      const stackResource = describeResourcesResponse.StackResources?.[0];
      if (!stackResource?.PhysicalResourceId) {
        console.log(`Could not find physical resource ID for analytics stack: ${logicalId}`);
        return [];
      }

      // Describe the nested stack to get its parameters
      const describeStacksResponse = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackResource.PhysicalResourceId,
        }),
      );

      return describeStacksResponse.Stacks?.[0]?.Parameters ?? [];
    } catch (error) {
      console.log(`Error getting analytics stack parameters: ${error}`);
      return [];
    }
  }

  public async generateKinesisAnalyticsL1Code(definition: KinesisAnalyticsDefinition): Promise<AnalyticsCodegenResult> {
    const resourceName = definition.name ?? 'kinesis';
    const stackFileName = `${resourceName}-stack`;
    const filePath = path.join(this.dir, 'amplify', 'analytics', `${stackFileName}.ts`);
    const templateS3Url = definition.providerMetadata.s3TemplateURL;
    const template = await getCfnTemplateFromS3(templateS3Url);
    const stackName = definition.providerMetadata.logicalId;

    const finalTemplate = await this.preTransmute(template, stackName);
    const tsFile = cdk_from_cfn.transmute(JSON.stringify(finalTemplate), 'typescript', stackName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await this.fileWriter(tsFile, filePath);

    // Extract the class name from the generated code
    const classNameMatch = tsFile.match(/export class (\w+) extends/);
    const stackClassName = classNameMatch ? classNameMatch[1] : `analytics${resourceName}`;

    return {
      stackClassName,
      stackFileName,
      resourceName,
    };
  }

  private async preTransmute(template: CFNTemplate, logicalId: string): Promise<CFNTemplate> {
    // Rename "env" parameter to "amplify-env"
    if (template.Parameters?.env) {
      template.Parameters['amplify-env'] = template.Parameters.env;
      delete template.Parameters.env;
    }

    // Update all Ref references from "env" to "amplify-env"
    const updateRefs = (obj: unknown): void => {
      if (typeof obj === 'object' && obj !== null) {
        const record = obj as Record<string, unknown>;
        if (record.Ref === 'env') {
          record.Ref = 'amplify-env';
        }
        Object.values(record).forEach(updateRefs);
      }
    };

    updateRefs(template.Resources);

    // Resolve CFN conditions using deployed stack parameters
    // This is critical because cdk-from-cfn generates broken TypeScript for CFN conditions
    // (e.g., `const shouldNotCreateEnvResources = props.env! === 'NONE';` which is invalid syntax)
    const parameters = await this.getAnalyticsStackParameters(logicalId);
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
