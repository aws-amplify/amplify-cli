import * as cdk from '@aws-cdk/core';
import * as crypto from 'crypto';
import { TemplateProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { FileAsset } from './file-asset';
export class MappingTemplate implements TemplateProvider {
  private content: string;
  private name: string;
  private asset?: FileAsset;
  static fromFile(path: string, templateName: string): MappingTemplate {
    throw new Error('Not implemented');
  }

  static fromInlineTemplate(code: string, templateName?: string): MappingTemplate {
    return new MappingTemplate(code, templateName);
  }

  constructor(content: string, name?: string) {
    this.content = content;
    const assetHash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
    this.name = name || `mapping-template-${assetHash}.vtl`;
  }

  bind(
    scope: cdk.Construct,
  ): {
    s3Location: {
      bucketName: string;
      objectKey: string;
      httpUrl: string;
      s3Url: string;
    };
  } {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset) {
      this.asset = new FileAsset(scope, `Template${this.name}`, {
        fileContent: this.content,
        fileName: this.name,
      });
    }
    return {
      s3Location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey,
        httpUrl: this.asset.httpUrl,
        s3Url: this.asset.s3Url,
      },
    };
  }
}
