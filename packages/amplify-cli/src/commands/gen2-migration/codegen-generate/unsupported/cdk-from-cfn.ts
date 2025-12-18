import * as path from 'path';
import * as fs from 'fs/promises';
import * as cdk_from_cfn from 'cdk-from-cfn';
import { CFNTemplate } from '../../refactor/types';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

export class CdkFromCfn {
  public constructor(private readonly dir: string, private readonly fileWriter: (content, path) => Promise<void>) {}

  public async generateKinesisAnalyticsL1Code(definition: any): Promise<void> {
    const filePath = path.join(this.dir, 'amplify', 'analytics', `${definition.name}-stack.ts`);
    const templateS3Url = definition.providerMetadata.s3TemplateURL;
    const template = await getS3ObjectContent(templateS3Url);
    const stackName = definition.providerMetadata.logicalId;

    const finalTemplate = this.preTransmute(template);
    const tsFile = cdk_from_cfn.transmute(JSON.stringify(finalTemplate), 'typescript', stackName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await this.fileWriter(tsFile, filePath);
  }

  private preTransmute(template: CFNTemplate): CFNTemplate {
    // Rename "env" parameter to "amplify-env"
    if (template.Parameters?.env) {
      template.Parameters['amplify-env'] = template.Parameters.env;
      delete template.Parameters.env;
    }

    // Update all Ref references from "env" to "amplify-env"
    const updateRefs = (obj: any): void => {
      if (typeof obj === 'object' && obj !== null) {
        if (obj.Ref === 'env') {
          obj.Ref = 'amplify-env';
        }
        Object.values(obj).forEach(updateRefs);
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
  return JSON.parse(await response.Body!.transformToString()) as CFNTemplate;
}
