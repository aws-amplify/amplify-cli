/* eslint-disable max-classes-per-file */
import {
  InlineMappingTemplateProvider,
  MappingTemplateType,
  S3MappingFunctionCodeProvider, S3MappingTemplateProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import * as cdk from '@aws-cdk/core';
import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import { FileAsset } from './file-asset';

export class S3MappingFunctionCode implements S3MappingFunctionCodeProvider {
  public readonly type = MappingTemplateType.S3_LOCATION;
  private asset?: FileAsset;
  private fileName: string;
  private filePath: string;

  constructor(fileName: string, filePath: string) {
    this.fileName = fileName;
    this.filePath = filePath;
  }

  bind(scope: cdk.Construct): FileAsset {
    if (!this.asset) {
      this.asset = new FileAsset(scope, `Code${this.fileName}`, {
        fileContent: this.filePath,
        fileName: this.fileName,
      });
    }
    return this.asset;
  }
}
export class S3MappingTemplate implements S3MappingTemplateProvider {
  private content: string;
  private name: string;
  private asset?: FileAsset;
  public readonly type = MappingTemplateType.S3_LOCATION;
  static fromFile(name: string, path: string): S3MappingTemplate {
    const fileContents = fs.readFileSync(path, { encoding: 'utf-8' });
    return new S3MappingTemplate(fileContents, name);
  }

  static fromInlineTemplate(code: string, templateName?: string): S3MappingTemplate {
    return new S3MappingTemplate(code, templateName);
  }

  constructor(content: string, name?: string) {
    this.content = content;
    const assetHash = crypto.createHash('sha256').update(content).digest('hex');
    this.name = name || `mapping-template-${assetHash}.vtl`;
  }

  bind(scope: cdk.Construct): string {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset) {
      this.asset = new FileAsset(scope, `Template${this.name}`, {
        fileContent: this.content,
        fileName: this.name,
      });
    }
    return this.asset.s3Url;
  }

  /**
   * get the resolver content
   * @returns string
   */
   getTemplateHash() : string {
    return crypto.createHash('sha256').update(this.content).digest('base64');
  }

  substitueValues(values: Record<string, string | number>): void {
    let { name } = this;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`({${key}})`, 'g');
      name = name.replace(regex, `${value}`);
    });
    this.name = name;
  }
}

export class InlineTemplate implements InlineMappingTemplateProvider {
  public readonly type = MappingTemplateType.INLINE;

  // eslint-disable-next-line no-useless-constructor
  constructor(private content: string) {}
  bind(): string {
    return this.content;
  }

  /**
   *  get the resolver inline template content
   * @returns string
   */
   getTemplateHash(): string {
    return crypto.createHash('sha256').update(this.content).digest('base64');
  }
}

export class MappingTemplate {
  static inlineTemplateFromString(template: string): InlineTemplate {
    return new InlineTemplate(template);
  }
  static s3MappingTemplateFromString(template: string, templateName: string): S3MappingTemplate {
    const templatePrefix = 'resolvers';
    return new S3MappingTemplate(template, `${templatePrefix}/${templateName}`);
  }
}
