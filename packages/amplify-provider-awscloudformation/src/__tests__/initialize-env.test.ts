import { downloadZip } from '../zip-util';
import { run } from '../initialize-env';
import { $TSContext, AmplifyException } from '@aws-amplify/amplify-cli-core';

jest.mock('../aws-utils/aws-s3');
jest.mock('../zip-util');

const downloadZipMock = downloadZip as jest.MockedFunction<typeof downloadZip>;

describe('initialize environment', () => {
  const contextStub = {
    amplify: {
      pathManager: {
        getAmplifyDirPath: jest.fn().mockReturnValue('some/path'),
        getCurrentCloudBackendDirPath: jest.fn(),
        getBackendDirPath: jest.fn(),
      },
    },
  } as unknown as $TSContext;
  it('throws AmplifyError if the deployment bucket does not exist', async () => {
    downloadZipMock.mockRejectedValueOnce({ code: 'NoSuchBucket' });
    const actual = await expect(run(contextStub, {})).rejects;
    await actual.toBeInstanceOf(AmplifyException);
    await actual.toMatchInlineSnapshot(
      `[EnvironmentNotInitializedError: Could not find a deployment bucket for the specified backend environment. This environment may have been deleted.]`,
    );
  });

  it('throws underlying error if the deployment bucket exists but fetching current-cloud-backend zip fails for some other reason', async () => {
    const errStub = { code: 'SomethingElse' };
    downloadZipMock.mockRejectedValueOnce(errStub);
    await expect(run(contextStub, {})).rejects.toEqual(errStub);
  });
});
