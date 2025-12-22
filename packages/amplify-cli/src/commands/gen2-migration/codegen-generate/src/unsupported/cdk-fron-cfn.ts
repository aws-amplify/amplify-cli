import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import { CFNTemplate } from '../../../refactor/types';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
  public constructor(private readonly dir: string, private readonly fileWriter: (content: string, filePath: string) => Promise<void>) {}

  public async generateKinesisAnalyticsL1Code(definition: KinesisAnalyticsDefinition): Promise<AnalyticsCodegenResult> {
    const resourceName = definition.name ?? 'kinesis';
    const stackFileName = `${resourceName}-stack`;
    const filePath = path.join(this.dir, 'amplify', 'analytics', `${stackFileName}.ts`);
    const templateS3Url = definition.providerMetadata.s3TemplateURL;
    const template = await getS3ObjectContent(templateS3Url);
    const stackName = definition.providerMetadata.logicalId;

    const finalTemplate = this.preTransmute(template);
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

  private preTransmute(template: CFNTemplate): CFNTemplate {
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

    // Resolve CFN conditions first
    // new CFNConditionResolver(template).resolve(template.Parameters);

    return template;
  }
}

async function getS3ObjectContent(s3Url: string): Promise<CFNTemplate> {
  const url = new URL(s3Url);
  const splitPath = url.pathname.split('/');
  const bucket = splitPath[1];
  const key = splitPath.slice(2).join('/');
  console.log('bucket', bucket, 'key', key);

  const s3Client = new S3Client({});
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error(`Failed to retrieve S3 object: ${s3Url}`);
  }
  return JSON.parse(await response.Body.transformToString()) as CFNTemplate;
}
