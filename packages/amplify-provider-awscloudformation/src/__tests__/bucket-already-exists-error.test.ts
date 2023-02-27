import { handleCloudFormationError } from '../handle-cloud-formation-error';
import { AmplifyException } from 'amplify-cli-core';

describe('bucket already exists error', () => {
  const mockError = {
    name: 'DeploymentFault',
    message: 'Resource is not in the state stackUpdateComplete',
    details: 'Name: S3Bucket (AWS::S3::Bucket), Event Type: create, Reason: bucket-name already exists',
  };

  it('bucket already exists error contents', async () => {
    const testThrowError = () => {
      handleCloudFormationError(mockError);
    };
    expect(testThrowError).toThrow('The S3 bucket bucket-name already exists.');
  });

  it('bucket already exists error type', async () => {
    try {
      handleCloudFormationError(mockError);
    } catch (error) {
      expect(error).toBeInstanceOf(AmplifyException);
    }
  });
});
