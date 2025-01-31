import * as crypto from 'crypto';
import * as cdk from 'aws-cdk-lib';
import { FileAssetPackaging, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TransformerStackSynthesizer } from './stack-synthesizer';

export interface TemplateProps {
  readonly fileContent: string;
  readonly fileName: string;
}

export class FileAsset extends Construct implements cdk.IAsset {
  public readonly assetHash: string;

  public readonly httpUrl: string;

  public readonly s3BucketName: string;

  public readonly s3ObjectKey: string;

  public readonly s3ObjectUrl: string;

  constructor(scope: Construct, id: string, props: TemplateProps) {
    super(scope, id);

    const rootStack = findRootStack(scope);
    const synthesizer = rootStack.synthesizer;

    // eslint-disable-next-line spellcheck/spell-checker
    // Check the constructor name instead of using 'instanceof' because the latter does not work
    // with copies of the class, which happens with custom transformers.
    // See: https://github.com/aws-amplify/amplify-cli/issues/9362
    if (synthesizer.constructor.name === TransformerStackSynthesizer.name) {
      (synthesizer as TransformerStackSynthesizer).setMappingTemplates(props.fileName, props.fileContent);
      this.assetHash = crypto.createHash('sha256').update(props.fileContent).digest('hex');
      const asset = synthesizer.addFileAsset({
        fileName: props.fileName,
        packaging: FileAssetPackaging.FILE,
        sourceHash: this.assetHash,
      });
      this.httpUrl = asset.httpUrl;
      this.s3BucketName = asset.bucketName;
      this.s3ObjectKey = asset.objectKey;
      this.s3ObjectUrl = asset.s3ObjectUrl;
    } else {
      throw new Error('Template asset can be used only with TransformerStackSynthesizer');
    }
  }
}

function findRootStack(scope: Construct): Stack {
  if (!scope) {
    throw new Error('Nested stacks cannot be defined as a root construct');
  }

  const rootStack = scope.node.scopes.find((p) => Stack.isStack(p));
  if (!rootStack) {
    throw new Error('Nested stacks must be defined within scope of another non-nested stack');
  }

  return rootStack as Stack;
}
