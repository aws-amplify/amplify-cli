import Bucket, { BucketEncryption, ServerSideEncryptionByDefault, ServerSideEncryptionRule } from 'cloudform-types/types/s3/bucket';
import _ from 'lodash';
import { ResourceModifier } from '../pre-push-cfn-modifier';

export const applyS3SSEModification: ResourceModifier = async (resource: Bucket) => {
  if (resource.Properties?.BucketEncryption) {
    return; // don't overwrite existing encryption config if present
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
};
