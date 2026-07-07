import { $TSAny, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { deserializeErrorMessages, CFNErrorMessage, CFNErrorMessages } from './aws-utils/cloudformation-error-serializer';
import { handleCommonSdkError } from './handle-common-sdk-errors';

const s3Indicator = '(AWS::S3::Bucket)';

const handleS3Error = (err: Error & { details?: string }): void => {
  const deserializedErrorMessages: CFNErrorMessages = deserializeErrorMessages(err.details);
  const bucketNameRegex = /(S3Bucket|CustomMessageConfirmationBucket) \(AWS::S3::Bucket\)*/;
  const bucketReasonRegex = /.* already exists*/;
  const bucketExistsLines: Array<CFNErrorMessage> = deserializedErrorMessages.messages.filter(
    (message) => bucketNameRegex.test(message.name) && bucketReasonRegex.test(message.reason),
  );
  if (bucketExistsLines.length) {
    const messageWithError: CFNErrorMessage = bucketExistsLines[0];
    const bucketRegex = /(.*) already exists*/;
    const bucketName = messageWithError.reason.match(bucketRegex)[1];
    throw new AmplifyError('ResourceAlreadyExistsError', {
      message: `The S3 bucket ${bucketName} already exists.`,
      resolution: `Please delete this bucket in the AWS S3 console and try again. The bucket can be found at: https://s3.console.aws.amazon.com/s3/buckets/${bucketName}.`,
    });
  }
};

export const handleCloudFormationError = (err: Error & { details?: string }): void => {
  if (err?.name === 'ValidationError' && err?.message === 'No updates are to be performed.') {
    return;
  }

  if (err?.name === 'ValidationError' && (err?.message ?? '').includes('_IN_PROGRESS state and can not be updated.')) {
    throw new AmplifyError(
      'DeploymentInProgressError',
      {
        message: 'Deployment is already in progress.',
        resolution: 'Wait for the other deployment to finish and try again.',
        code: (err as $TSAny).name,
      },
      err,
    );
  }

  throwIfAllErrorsAreFromCustomResources(err);

  if (err?.details?.includes(s3Indicator)) {
    handleS3Error(err);
  }

  err = handleCommonSdkError(err);

  throw err;
};

const throwIfAllErrorsAreFromCustomResources = (err: Error & { details?: string }) => {
  const deserializedErrorMessages: CFNErrorMessages = deserializeErrorMessages(err.details);
  const onlyCustomResourceError =
    deserializedErrorMessages?.messages.length > 0 &&
    deserializedErrorMessages.messages.every((cfnError: CFNErrorMessage) => cfnError.isCustomResource);
  if (onlyCustomResourceError) {
    throw new AmplifyError(
      'InvalidCustomResourceError',
      {
        message: 'CFN Deployment failed for custom resources.',
        details: err.details,
      },
      err,
    );
  }
  // else let the calling function throw the original error
};
