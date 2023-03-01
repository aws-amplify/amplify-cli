import { $TSAny, AmplifyError } from 'amplify-cli-core';
import { deserializeErrorMessages, ErrorMessage, ErrorMessages } from './aws-utils/cloudformation-error-serializer';

const s3Indicator = '(AWS::S3::Bucket)';

const handleS3Error = (err: Error & { details?: string }): void => {
  const alreadyExistsSuffix = 'already exists';
  const deserializedErrorMessages: ErrorMessages = deserializeErrorMessages(err.details);
  const bucketExistsLines: Array<ErrorMessage> = deserializedErrorMessages.messages.filter(
    (message) => message.name.includes(s3Indicator) && message.reason.includes(alreadyExistsSuffix),
  );
  if (bucketExistsLines.length) {
    const messageWithError: ErrorMessage = bucketExistsLines[0];
    const bucketName = messageWithError.reason.slice(0, messageWithError.reason.length - alreadyExistsSuffix.length - 1);
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
        code: (err as $TSAny).code,
      },
      err,
    );
  }

  if (err?.details?.includes(s3Indicator)) {
    handleS3Error(err);
  }

  throw err;
};
