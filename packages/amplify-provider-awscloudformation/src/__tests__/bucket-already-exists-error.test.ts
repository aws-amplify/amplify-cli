import { handleCloudFormationError } from '../cloud-formation-error-handler';
import { AmplifyException } from 'amplify-cli-core';

describe('bucket already exists error', () => {
  const bucketName = 'bucket-name';
  const mockError = {
    name: 'DeploymentFault',
    message: 'Resource is not in the state stackUpdateComplete',
    details: `Name: S3Bucket (AWS::S3::Bucket), Event Type: create, Reason: ${bucketName} already exists`,
  };

  const mockErrorMultiLineDetails = {
    name: 'DeploymentFault',
    message: 'Resource is not in the state stackUpdateComplete',
    details: `Name: DeploymentBucket (AWS::S3::Bucket), Event Type: create, Reason: amplify-something-deployment already exists\nName: <stackName> (AWS::CloudFormation::Stack), Event Type: update, Reason: Parameters: [a1] must have values\nName: S3Bucket (AWS::S3::Bucket), Event Type: create, Reason: ${bucketName} already exists\n`,
  };

  it('bucket already exists error contents', async () => {
    expect(() => {
      handleCloudFormationError(mockError);
    }).toThrowError(
      expect.objectContaining({
        classification: 'ERROR',
        name: 'ResourceAlreadyExistsError',
        message: `The S3 bucket ${bucketName} already exists.`,
      }),
    );
  });

  it('bucket already exists error type', async () => {
    try {
      handleCloudFormationError(mockError);
    } catch (error) {
      expect(error).toBeInstanceOf(AmplifyException);
    }
  });

  it('bucket already exists error contents multi-line details', async () => {
    expect(() => {
      handleCloudFormationError(mockErrorMultiLineDetails);
    }).toThrowError(
      expect.objectContaining({
        classification: 'ERROR',
        name: 'ResourceAlreadyExistsError',
        message: `The S3 bucket ${bucketName} already exists.`,
      }),
    );
  });

  it('bucket already exists error type multi-line details', async () => {
    try {
      handleCloudFormationError(mockErrorMultiLineDetails);
    } catch (error) {
      expect(error).toBeInstanceOf(AmplifyException);
    }
  });
});
