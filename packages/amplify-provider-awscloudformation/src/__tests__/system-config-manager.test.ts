import { getProfileCredentials } from '../system-config-manager';
import fs from 'fs-extra';

jest.mock('../utils/aws-logger', () => ({
  fileLogger: () => jest.fn(() => jest.fn()),
}));
jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

describe('profile tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  fs_mock.existsSync.mockImplementation(() => {
    return true;
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

  it('should fail to return profile credentials', () => {
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return '[fake]\nmalformed_access_key_id=fakeAccessKey\naws_secret_access_key=fakeSecretKey\n';
    });
    expect(() => getProfileCredentials('fake')).toThrow("Profile configuration for 'fake' is invalid: missing aws_access_key_id");
    expect(fs_mock.existsSync).toHaveBeenCalledTimes(1);
    expect(fs_mock.readFileSync).toHaveBeenCalledTimes(1);
  });

  it('should fail to return profile credentials', () => {
    fs_mock.readFileSync.mockImplementationOnce(() => {
      return '[fake]\nmalformed_key_id=fakeAccessKey\nmalformed_secret_access_key=fakeSecretKey\n';
    });
    expect(() => getProfileCredentials('fake')).toThrowError(
      "Profile configuration for 'fake' is invalid: missing aws_access_key_id, aws_secret_access_key",
    );
    expect(fs_mock.existsSync).toHaveBeenCalledTimes(1);
    expect(fs_mock.readFileSync).toHaveBeenCalledTimes(1);
  });
});
