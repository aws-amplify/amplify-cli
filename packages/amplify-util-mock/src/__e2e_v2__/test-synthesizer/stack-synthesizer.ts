import * as crypto from 'crypto';
import { ISynthesisSession, Stack, LegacyStackSynthesizer, FileAssetSource, FileAssetLocation, CfnParameter } from 'aws-cdk-lib';
import { Template } from './deployment-resources';
import { TransformerRootStack } from './root-stack';

/**
 * TransformerStackSynthesizer
 */
export class TransformerStackSynthesizer extends LegacyStackSynthesizer {
  private readonly stackAssets: Map<string, Template> = new Map();

  private readonly mappingTemplateAssets: Map<string, string> = new Map();

  private _deploymentBucket?: CfnParameter;

  private _deploymentRootKey?: CfnParameter;

  /**
   * synthesizeStackTemplate
   *
   * This method has been deprecated by cdk and is not used in runtime.
   * @deprecated Replaced by synthesizeTemplate.
   */
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected synthesizeTemplate(session: ISynthesisSession, _?: string): FileAssetSource {
    const stack = this.boundStack;
    if (stack instanceof TransformerRootStack) {
      const template = stack.renderCloudFormationTemplate(session) as string;
      const templateName = stack.node.id;
      this.setStackAsset(templateName, template);
      const contentHash = crypto.createHash('sha256').update(template).digest('hex');
      return {
        sourceHash: contentHash,
      };
    }
    throw new Error(
      'Error synthesizing the template. Expected Stack to be either instance of TransformerRootStack or TransformerNestedStack',
    );
  }

  /**
   * setStackAsset
   */
  setStackAsset(templateName: string, template: string): void {
    this.stackAssets.set(templateName, JSON.parse(template));
  }

  /**
   * collectStacks
   */
  collectStacks(): Map<string, Template> {
    return new Map(this.stackAssets.entries());
  }

  /**
   * setMappingTemplates
   */
  setMappingTemplates(templateName: string, template: string): void {
    this.mappingTemplateAssets.set(templateName, template);
  }

  /**
   * collectMappingTemplates
   */
  collectMappingTemplates(): Map<string, string> {
    return new Map(this.mappingTemplateAssets.entries());
  }

  /**
   * addFileAsset
   */
  public addFileAsset(asset: FileAssetSource): FileAssetLocation {
    const bucketName = this.deploymentBucket.valueAsString;
    const rootKey = this.deploymentRootKey.valueAsString;

    const objectKey = `${rootKey}/${asset.fileName}`;
    const httpUrl = `https://s3.${this.boundStack.region}.${this.boundStack.urlSuffix}/${bucketName}/${rootKey}/${asset.fileName}`;
    const s3ObjectUrl = `s3://${bucketName}/${rootKey}/${asset.fileName}`;

    return {
      bucketName,
      objectKey,
      httpUrl,
      s3ObjectUrl,
    };
  }

  /**
   * ensureDeploymentParameters
   */
  private ensureDeploymentParameters() {
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

  /**
   * deploymentBucket
   */
  private get deploymentBucket(): CfnParameter {
    this.ensureDeploymentParameters();
    assertNotNull(this._deploymentBucket);
    return this._deploymentBucket;
  }

  /**
   * deploymentRootKey
   */
  private get deploymentRootKey(): CfnParameter {
    this.ensureDeploymentParameters();
    assertNotNull(this._deploymentRootKey);
    return this._deploymentRootKey;
  }
}

/**
 * assertNotNull
 */
export function assertNotNull<A>(x: A | undefined): asserts x is NonNullable<A> {
  if (x === null && x === undefined) {
    throw new Error('You must call bindStack() first');
  }
}
