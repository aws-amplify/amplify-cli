import { $TSContext } from 'amplify-cli-core';
import fs from 'fs-extra';
import { ProcessCredentials } from 'aws-sdk';
import { getProfileCredentials, getProfiledAwsConfig } from '../system-config-manager';

jest.setTimeout(15000);

jest.mock('../utils/aws-logger', () => ({
  fileLogger: () => jest.fn(() => jest.fn()),
}));
jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

jest.mock('aws-sdk');
const ProcessCredentialsMock = ProcessCredentials as jest.MockedClass<typeof ProcessCredentials>;

const context_stub = ({
  print: {
    info: jest.fn(),
  },
} as unknown) as jest.Mocked<$TSContext>;

describe('profile tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  fs_mock.existsSync.mockReturnValue(true);

  it('should use credential_process defined in config file', async () => {
    // setup
    const awsConfigContent = `[profile fake]
    output = json
    region = us-fake-1
    credential_process = fake command`;

    fs_mock.readFileSync.mockReturnValue(awsConfigContent);

    const credentialProcessFetcher = jest.fn();

    ProcessCredentialsMock.mockImplementation(() => ({
      accessKeyId: 'testAccessKey',
      secretAccessKey: 'testSecret',
      sessionToken: 'testSessionToken',
      expireTime: new Date(1234),
      expired: false,
      get: jest.fn(),
      getPromise: credentialProcessFetcher,
      needsRefresh: jest.fn(),
      refresh: jest.fn(),
      refreshPromise: jest.fn(),
    }));

    // test
    const profile_config = await getProfiledAwsConfig(context_stub, 'fake');

    // expect
    expect(credentialProcessFetcher).toHaveBeenCalled();
    expect(profile_config).toBeDefined();
    expect(profile_config.accessKeyId).toBe('testAccessKey');
    expect(profile_config.secretAccessKey).toBe('testSecret');
    expect(profile_config.sessionToken).toBe('testSessionToken');
    expect(profile_config.expiration).toEqual(new Date(1234));
  });

  it('should fail to return profiled aws credentials', async () => {
    const profile_file_contents = '[fake]\nmalformed_key_id=fakeAccessKey\nmalformed_secret_access_key=fakeSecretKey\n';
    fs_mock.readFileSync
      .mockImplementationOnce(() => {
        return profile_file_contents;
      })
      .mockImplementationOnce(() => {
        return profile_file_contents;
      });
    const getProfileCredentials_mock = jest.fn(getProfileCredentials);
    await expect(() => getProfiledAwsConfig(context_stub, 'fake')).rejects.toThrowError(
      "Profile configuration for 'fake' is invalid: missing aws_access_key_id, aws_secret_access_key",
    );
    expect(getProfileCredentials_mock).toHaveBeenCalledTimes(0);
  });

  it('should return profile credentials with aws prefix snake_case', () => {
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return '[fake]\naws_access_key_id=fakeAccessKey\naws_secret_access_key=fakeSecretKey\n';
    });
    const creds = getProfileCredentials('fake');
    expect(creds).toBeDefined();
    expect(fs_mock.existsSync).toHaveBeenCalledTimes(1);
    expect(fs_mock.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should return profile credentials without aws prefix and camelCase', () => {
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return '[fake]\naccessKeyId=fakeAccessKey\nsecretAccessKey=fakeSecretKey\n';
    });
    const creds = getProfileCredentials('fake');
    expect(creds).toBeDefined();
    expect(fs_mock.existsSync).toHaveBeenCalledTimes(1);
    expect(fs_mock.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should return profile credentials when using a source_profile and role_arn', () => {
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return '[fake]\nrole_arn=arn:aws:iam::123456789012:role/fakerole\nsource_profile=fakeuser\n';
    });
    const creds = getProfileCredentials('fake');
    expect(creds).toBeDefined();
    expect(fs_mock.existsSync).toHaveBeenCalledTimes(1);
    expect(fs_mock.readFileSync).toHaveBeenCalledTimes(1);
  });
});
