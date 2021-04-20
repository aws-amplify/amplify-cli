import Bucket, { BucketEncryption, ServerSideEncryptionByDefault, ServerSideEncryptionRule } from 'cloudform-types/types/s3/bucket';
import { ResourceModifier } from '../pre-push-cfn-modifier';

export const applyS3SSEModification: ResourceModifier<Bucket> = async resource => {
  if (resource?.Properties?.BucketEncryption) {
    return resource; // don't overwrite existing encryption config if present
  }
  if (!resource.Properties || typeof resource.Properties !== 'object') {
    resource.Properties = {};
  }
  resource.Properties.BucketEncryption = new BucketEncryption({
    ServerSideEncryptionConfiguration: [
      new ServerSideEncryptionRule({
        ServerSideEncryptionByDefault: new ServerSideEncryptionByDefault({
          SSEAlgorithm: 'AES256',
        }),
      }),
    ],
  });
  return resource;
};
