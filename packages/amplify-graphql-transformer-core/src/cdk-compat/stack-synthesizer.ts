import { ISynthesisSession, Stack, LegacyStackSynthesizer, FileAssetSource, FileAssetLocation, CfnParameter } from '@aws-cdk/core';
import Template from '../transformation/types';
import { TransformerRootStack } from './root-stack';

export class TransformerStackSythesizer extends LegacyStackSynthesizer {
  private static readonly stackAssets: Map<string, Template> = new Map();
  private static readonly mapingTemplateAssets: Map<string, string> = new Map();
  private _deploymentBucket?: CfnParameter;
  private _deploymentRootKey?: CfnParameter;
  private boundStack?: Stack;

  public bind(stack: Stack): void {
    this.boundStack = stack;
    super.bind(stack);
  }
  protected synthesizeStackTemplate(stack: Stack, session: ISynthesisSession): void {
    if (stack instanceof TransformerRootStack) {
      const template = stack.renderCloudFormationTemplate(session) as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
      return;
    }
    throw new Error(
      'Error synthesizing the template. Expected Stack to be either instance of TransformerRootStack or TransformerNestedStack',
    );
  }

  setStackAsset(templateName: string, template: string): void {
    TransformerStackSythesizer.stackAssets.set(templateName, JSON.parse(template));
  }

  collectStacks(): Map<string, Template> {
    return new Map(TransformerStackSythesizer.stackAssets.entries());
  }

  setMappingTemplates(templateName: string, template: string): void {
    TransformerStackSythesizer.mapingTemplateAssets.set(templateName, template);
  }

  collectMappingTemplates(): Map<string, string> {
    return new Map(TransformerStackSythesizer.mapingTemplateAssets.entries());
  }
  public addFileAsset(asset: FileAssetSource): FileAssetLocation {
    assertNotNull(this.boundStack);

    const bucketName = this.deploymentBucket.valueAsString;
    const rootKey = this.deploymentRootKey.valueAsString;

    const objectKey = `${rootKey}/${asset.fileName}`;
    const httpUrl = `https://s3.${this.boundStack.region}.${this.boundStack.urlSuffix}/${bucketName}/${rootKey}/${asset.fileName}`;
    const s3ObjectUrl = `s3://${bucketName}/${rootKey}/${asset.fileName}`;

    return { bucketName, objectKey, httpUrl, s3ObjectUrl, s3Url: httpUrl };
  }

  private ensureDeployementParameters() {
    assertNotNull(this.boundStack);

    if (!this._deploymentBucket) {
      this._deploymentBucket = new CfnParameter(this.boundStack, 'S3DeploymentBucket', {
        type: 'String',
        description: 'An S3 Bucket name where assets are deployed',
      });
    }
    if (!this._deploymentRootKey) {
      this._deploymentRootKey = new CfnParameter(this.boundStack, 'S3DeploymentRootKey', {
        type: 'String',
        description: 'An S3 key relative to the S3DeploymentBucket that points to the root of the deployment directory.',
      });
    }
  }

  private get deploymentBucket(): CfnParameter {
    this.ensureDeployementParameters();
    assertNotNull(this._deploymentBucket);
    return this._deploymentBucket;
  }

  private get deploymentRootKey(): CfnParameter {
    this.ensureDeployementParameters();
    assertNotNull(this._deploymentRootKey);
    return this._deploymentRootKey;
  }
}

export function assertNotNull<A>(x: A | undefined): asserts x is NonNullable<A> {
  if (x === null && x === undefined) {
    throw new Error('You must call bindStack() first');
  }
}
