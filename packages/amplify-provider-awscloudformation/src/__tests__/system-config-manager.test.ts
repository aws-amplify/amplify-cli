import { $TSContext } from 'amplify-cli-core';
import fs from 'fs-extra';
import { getProfileCredentials, getProfiledAwsConfig } from '../system-config-manager';

jest.setTimeout(15000);

jest.mock('../utils/aws-logger', () => ({
  fileLogger: () => jest.fn(() => jest.fn()),
}));
jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

const context_stub = ({
  print: {
    info: jest.fn(),
  },
} as unknown) as jest.Mocked<$TSContext>;

describe('profile tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  fs_mock.existsSync.mockImplementation(() => {
    return true;
  });

  it('should use credential_process defined in config file', async () => {
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return '[profile fake]\noutput = json\nregion = us-fake-1\ncredential_process = fake credential process';
    });
    const getProfileCredentials_mock = jest.fn(getProfileCredentials);
    const profile_config = await getProfiledAwsConfig(context_stub, 'fake');
    expect(profile_config).toBeDefined();
    expect(getProfileCredentials_mock).toHaveBeenCalledTimes(0);
  });

  it('should fail to return profiled aws credentials', async () => {
    const profile_file_contents = '[fake]\nmalformed_key_id=fakeAccessKey\nmalformed_secret_access_key=fakeSecretKey\n'
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return profile_file_contents;
    }).mockImplementationOnce(() => {
      return profile_file_contents;
    });
    const getProfileCredentials_mock = jest.fn(getProfileCredentials);
    await expect(() => getProfiledAwsConfig(context_stub, 'fake')).rejects.toThrowError("Profile configuration for 'fake' is invalid: missing aws_access_key_id, aws_secret_access_key");
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
