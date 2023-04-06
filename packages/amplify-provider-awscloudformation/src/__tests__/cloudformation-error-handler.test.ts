import { handleCloudFormationError } from '../cloud-formation-error-handler';
import { CFNErrorMessage, serializeErrorMessages } from '../aws-utils/cloudformation-error-serializer';
import { AmplifyError, AmplifyException } from '@aws-amplify/amplify-cli-core';

describe('handleCloudFormationError', () => {
  let cfnError;

  beforeEach(() => {
    cfnError = new Error('ResourceNotReady');
    cfnError.message = 'Resource is not in the state stackUpdateComplete';
  });

  it('throws the same error if details are null', () => {
    expect(() => {
      expect(handleCloudFormationError(cfnError));
    }).toThrowError(cfnError);
  });

  it('throws the same error if details are empty', () => {
    cfnError.details = '';
    expect(() => {
      expect(handleCloudFormationError(cfnError));
    }).toThrowError(cfnError);
  });

  it('throws the same error if all erred resources are non-custom resources', () => {
    const error1: CFNErrorMessage = {
      name: 'error1',
      eventType: 'create',
      reason: 'reason1',
      isCustomResource: false,
    };
    const error2: CFNErrorMessage = {
      name: 'error2',
      eventType: 'create',
      reason: 'reason2',
      isCustomResource: false,
    };
    cfnError.details = serializeErrorMessages({ messages: [error1, error2] });
    expect(() => {
      expect(handleCloudFormationError(cfnError));
    }).toThrowError(cfnError);
  });

  it('throws an AmplifyError if all erred resources are from custom resources', () => {
    const error1: CFNErrorMessage = {
      name: 'error1',
      eventType: 'create',
      reason: 'reason1',
      isCustomResource: true,
    };
    const error2: CFNErrorMessage = {
      name: 'error2',
      eventType: 'create',
      reason: 'reason2',
      isCustomResource: true,
    };
    cfnError.details = serializeErrorMessages({ messages: [error1, error2] });
    const expectedAmplifyException = new AmplifyError('InvalidCustomResourceError', {
      message: 'CFN Deployment failed for custom resources.',
      details: cfnError.details,
    });
    expect(() => {
      expect(handleCloudFormationError(cfnError));
    }).toThrowError(expectedAmplifyException);
  });

  it('throws the same error if there is at least one error from non-custom resource', () => {
    const error1: CFNErrorMessage = {
      name: 'error1',
      eventType: 'create',
      reason: 'reason1',
      isCustomResource: true,
    };
    const error2: CFNErrorMessage = {
      name: 'error2',
      eventType: 'create',
      reason: 'reason2',
      isCustomResource: false,
    };
    cfnError.details = serializeErrorMessages({ messages: [error1, error2] });
    expect(() => {
      expect(handleCloudFormationError(cfnError));
    }).toThrowError(cfnError);
  });
});

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
