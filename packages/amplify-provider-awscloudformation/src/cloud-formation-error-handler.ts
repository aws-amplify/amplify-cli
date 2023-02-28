import { $TSAny, AmplifyError } from 'amplify-cli-core';

const s3Indicator = '(AWS::S3::Bucket)';

const handleS3Error = (err: Error & { details?: string }): void => {
  const alreadyExistsSuffix = 'already exists';
  const errorDetailLines = err.details.split('\n');
  const bucketExistsLines = errorDetailLines.filter((line) => line.includes(s3Indicator) && line.includes(alreadyExistsSuffix));
  if (bucketExistsLines.length) {
    const lineWithError = bucketExistsLines[0];
    const prefix = `Name: ${
      lineWithError.includes('CustomMessageConfirmationBucket') ? 'CustomMessageConfirmationBucket' : 'S3Bucket'
    } (AWS::S3::Bucket), Event Type: create, Reason:`;
    const bucketName = lineWithError.slice(prefix.length + 1, lineWithError.length - alreadyExistsSuffix.length - 1);
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
