import { $TSAny, AmplifyError } from 'amplify-cli-core';

const handleS3Error = (err: Error & { details?: string }): void => {
  const alreadyExistsSuffix = 'already exists';
  if (err?.details?.includes(alreadyExistsSuffix)) {
    const prefix = `Name: ${
      err.details.includes('CustomMessageConfirmationBucket') ? 'CustomMessageConfirmationBucket' : 'S3Bucket'
    } (AWS::S3::Bucket), Event Type: create, Reason:`;
    const bucketName = err.details.slice(prefix.length + 1, err.details.length - alreadyExistsSuffix.length - 1);
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

  const s3Indicator = '(AWS::S3::Bucket)';
  if (err?.details?.includes(s3Indicator)) {
    handleS3Error(err);
  }

  throw err;
};
