import * as cdk from '@aws-cdk/core';
import * as crypto from 'crypto';
import { TransformerStackSythesizer } from './stack-synthesizer';
import { Construct, FileAssetPackaging, Stack } from '@aws-cdk/core';

export interface TemplateProps {
  readonly fileContent: string;
  readonly fileName: string;
}

export class FileAsset extends cdk.Construct implements cdk.IAsset {
  public readonly assetHash: string;
  public readonly httpUrl: string;
  public readonly s3BucketName: string;
  public readonly s3ObjectKey: string;
  public readonly s3Url: string;
  constructor(scope: cdk.Construct, id: string, props: TemplateProps) {
    super(scope, id);

    const rootStack = findRootStack(scope);
    const sythesizer = rootStack.synthesizer;

    // Check the constructor name instead of using 'instanceof' because the latter does not work
    // with copies of the class, which happens with custom transformers.
    // See: https://github.com/aws-amplify/amplify-cli/issues/9362
    if (sythesizer.constructor.name === TransformerStackSythesizer.name) {
      (sythesizer as TransformerStackSythesizer).setMappingTemplates(props.fileName, props.fileContent);
      this.assetHash = crypto
        .createHash('sha256')
        .update(props.fileContent)
        .digest('hex');
      const asset = sythesizer.addFileAsset({
        fileName: props.fileName,
        packaging: FileAssetPackaging.FILE,
        sourceHash: this.assetHash,
      });
      this.httpUrl = asset.httpUrl;
      this.s3BucketName = asset.bucketName;
      this.s3ObjectKey = asset.objectKey;
      this.s3Url = asset.s3ObjectUrl;
    } else {
      // TODO: handle a generic synthesizer by creating a asset in output path
      throw new Error('Template asset can be used only with TransformerStackSynthesizer');
    }
  }
}

function findRootStack(scope: Construct): Stack {
  if (!scope) {
    throw new Error('Nested stacks cannot be defined as a root construct');
  }

  const rootStack = scope.node.scopes.find(p => Stack.isStack(p));
  if (!rootStack) {
    throw new Error('Nested stacks must be defined within scope of another non-nested stack');
  }

  return rootStack as Stack;
}

