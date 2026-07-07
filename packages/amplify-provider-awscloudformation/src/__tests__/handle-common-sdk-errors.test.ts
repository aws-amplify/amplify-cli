import { handleCommonSdkError } from '../handle-common-sdk-errors';

describe('handle common sdk errors', () => {
  const confirmCorrectError = (functionToThrowError, expectedResolution) => {
    try {
      functionToThrowError();
    } catch (errorThrown) {
      expect(errorThrown.resolution).toBe(expectedResolution);
    }
  };

  it('rate exceeded error', () => {
    const toThrowError = () => {
      try {
        throw new Error('Rate Exceeded');
      } catch (error) {
        throw handleCommonSdkError(error);
      }
    };

    confirmCorrectError(toThrowError, 'Try again later.');
  });

  it('not authorized error', () => {
    const toThrowError = () => {
      try {
        throw new Error(
          'User: ARN is not authorized to perform: ACTION:ACTION on resource: RESOURCE because no identity-based policy allows the ACTION:ACTION action',
        );
      } catch (error) {
        throw handleCommonSdkError(error);
      }
    };

    confirmCorrectError(toThrowError, 'Update the permissions.');
  });
});
