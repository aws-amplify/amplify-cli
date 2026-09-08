import { $TSContext, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import { fromProcess } from '@aws-sdk/credential-providers';
import { getProfileCredentials, getProfiledAwsConfig } from '../system-config-manager';

jest.setTimeout(15000);

jest.mock('../utils/aws-logger', () => ({
  fileLogger: () => jest.fn(() => jest.fn()),
}));
jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;

jest.mock('@aws-amplify/amplify-cli-core', () => {
  const actual = jest.requireActual('@aws-amplify/amplify-cli-core');
  return {
    ...actual,
    pathManager: {
      ...actual.pathManager,
      getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('/mock/home/.amplify'),
      getAWSCredentialsFilePath: jest.fn().mockReturnValue('/mock/home/.aws/credentials'),
      getAWSConfigFilePath: jest.fn().mockReturnValue('/mock/home/.aws/config'),
    },
    JSONUtilities: {
      readJson: jest.fn(),
      writeJson: jest.fn(),
    },
  };
});

jest.mock('@aws-sdk/credential-providers');
const fromProcessMock = fromProcess as jest.MockedFunction<typeof fromProcess>;

// Mock STS client
const mockSTSSend = jest.fn();
jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn().mockImplementation(() => ({
    send: mockSTSSend,
  })),
  AssumeRoleCommand: jest.fn().mockImplementation((input) => input),
}));

const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;

const context_stub = {
  print: {
    info: jest.fn(),
  },
} as unknown as jest.Mocked<$TSContext>;

describe('profile tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  fs_mock.existsSync.mockReturnValue(true);

  describe('credential process loading', () => {
    const mockCredentials = {
      accessKeyId: 'chainTestAccessKey',
      secretAccessKey: 'chainTestSecret',
      sessionToken: 'chainTestSessionToken',
      expiration: new Date(1234),
    };

    const mockCredentialProvider = jest.fn().mockResolvedValue(mockCredentials);

    beforeEach(() => {
      // setup
      const awsConfigContent = `[profile fake]
            output = json
            region = us-fake-1
            credential_process = fake command`;

      fs_mock.readFileSync.mockReturnValue(awsConfigContent);

      fromProcessMock.mockReturnValue(mockCredentialProvider);
    });

    it('should use credential_process defined in config file', async () => {
      // test
      const profile_config = await getProfiledAwsConfig(context_stub, 'fake');

      // expect
      expect(profile_config).toBeDefined();
      expect(fromProcessMock).toHaveBeenCalledWith({ profile: 'fake' });
      expect(mockCredentialProvider).toHaveBeenCalled();
      expect(profile_config.credentials.accessKeyId).toBe('chainTestAccessKey');
      expect(profile_config.credentials.secretAccessKey).toBe('chainTestSecret');
      expect(profile_config.credentials.sessionToken).toBe('chainTestSessionToken');
      expect(profile_config.credentials.expiration).toEqual(new Date(1234));
    });

    it('sets AWS_SDK_LOAD_CONFIG while credential provider executes', async () => {
      const sdkLoadConfigOriginal = process.env.AWS_SDK_LOAD_CONFIG;
      mockCredentialProvider.mockImplementationOnce(() => {
        expect(process.env.AWS_SDK_LOAD_CONFIG).toBeTruthy();
        return Promise.resolve({
          accessKeyId: 'chainTestAccessKey',
          secretAccessKey: 'chainTestSecret',
          sessionToken: 'chainTestSessionToken',
          expiration: new Date(1234),
        });
      });

      await getProfiledAwsConfig(context_stub, 'fake');
      expect(fromProcessMock).toHaveBeenCalledWith({ profile: 'fake' });
      expect(mockCredentialProvider).toHaveBeenCalled();
      expect(process.env.AWS_SDK_LOAD_CONFIG).toStrictEqual(sdkLoadConfigOriginal);
    });
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

  describe('credential caching for role assumption', () => {
    const mockRoleArn = 'arn:aws:iam::123456789012:role/TestRole';
    const mockSessionName = 'amplify';
    const futureExpiration = new Date(Date.now() + 3600000); // 1 hour from now
    const pastExpiration = new Date(Date.now() - 3600000); // 1 hour ago

    const mockValidCredentials = {
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      sessionToken: 'FwoGZXIvYXdzEBYaDk...',
      expiration: futureExpiration.toISOString(),
    };

    const roleProfileConfig = `[profile testrole]
region = us-east-1
role_arn = ${mockRoleArn}
source_profile = testuser

[profile testuser]
region = us-east-1`;

    const sourceProfileCredentials = `[testuser]
aws_access_key_id = AKIAIOSFODNN7SOURCE
aws_secret_access_key = sourceSecretKey`;

    beforeEach(() => {
      jest.clearAllMocks();
      fs_mock.existsSync.mockReturnValue(true);
      fs_mock.ensureDirSync.mockReturnValue(undefined);
      mockSTSSend.mockReset();
    });

    describe('getCachedRoleCredentials behavior', () => {
      it('should return undefined when cache file does not exist', async () => {
        // Setup: profile with role_arn, but no cache file
        fs_mock.existsSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('.amplify')) return false; // cache doesn't exist
            return true; // config/credentials exist
          }
          return false;
        });
        fs_mock.readFileSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('config')) return roleProfileConfig;
            if (path.includes('credentials')) return sourceProfileCredentials;
          }
          return '';
        });

        // Mock STS to return credentials (since no cache)
        mockSTSSend.mockResolvedValue({
          Credentials: {
            AccessKeyId: 'AKIAIOSFODNN7ASSUMED',
            SecretAccessKey: 'assumedSecretKey',
            SessionToken: 'assumedSessionToken',
            Expiration: futureExpiration,
          },
        });

        const result = await getProfiledAwsConfig(context_stub, 'testrole');

        // Should have called STS to get new credentials (not from cache)
        expect(mockSTSSend).toHaveBeenCalled();
        expect(result.credentials.accessKeyId).toBe('AKIAIOSFODNN7ASSUMED');
      });

      it('should return undefined when roleArn not in cache', async () => {
        fs_mock.existsSync.mockReturnValue(true);
        fs_mock.readFileSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('config')) return roleProfileConfig;
            if (path.includes('credentials')) return sourceProfileCredentials;
          }
          return '';
        });

        // Cache exists but doesn't have our role
        JSONUtilitiesMock.readJson.mockReturnValue({
          'arn:aws:iam::999999999999:role/OtherRole': {
            amplify: mockValidCredentials,
          },
        });

        mockSTSSend.mockResolvedValue({
          Credentials: {
            AccessKeyId: 'AKIAIOSFODNN7ASSUMED',
            SecretAccessKey: 'assumedSecretKey',
            SessionToken: 'assumedSessionToken',
            Expiration: futureExpiration,
          },
        });

        const result = await getProfiledAwsConfig(context_stub, 'testrole');

        // Should have called STS since role not in cache
        expect(mockSTSSend).toHaveBeenCalled();
      });

      it('should return undefined when cached credentials are expired', async () => {
        fs_mock.existsSync.mockReturnValue(true);
        fs_mock.readFileSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('config')) return roleProfileConfig;
            if (path.includes('credentials')) return sourceProfileCredentials;
          }
          return '';
        });

        // Cache has expired credentials
        JSONUtilitiesMock.readJson.mockReturnValue({
          [mockRoleArn]: {
            [mockSessionName]: {
              ...mockValidCredentials,
              expiration: pastExpiration.toISOString(),
            },
          },
        });

        mockSTSSend.mockResolvedValue({
          Credentials: {
            AccessKeyId: 'AKIAIOSFODNN7ASSUMED',
            SecretAccessKey: 'assumedSecretKey',
            SessionToken: 'assumedSessionToken',
            Expiration: futureExpiration,
          },
        });

        const result = await getProfiledAwsConfig(context_stub, 'testrole');

        // Should have called STS since cached credentials are expired
        expect(mockSTSSend).toHaveBeenCalled();
      });

      it('should return valid cached credentials with Date expiration', async () => {
        fs_mock.existsSync.mockReturnValue(true);
        fs_mock.readFileSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('config')) return roleProfileConfig;
            if (path.includes('credentials')) return sourceProfileCredentials;
          }
          return '';
        });

        // Cache has valid credentials (stored as flat object with string expiration)
        JSONUtilitiesMock.readJson.mockReturnValue({
          [mockRoleArn]: {
            [mockSessionName]: mockValidCredentials,
          },
        });

        const result = await getProfiledAwsConfig(context_stub, 'testrole');

        // Should NOT have called STS since valid credentials in cache
        expect(mockSTSSend).not.toHaveBeenCalled();
        expect(result.credentials.accessKeyId).toBe(mockValidCredentials.accessKeyId);
        expect(result.credentials.secretAccessKey).toBe(mockValidCredentials.secretAccessKey);
        // Verify expiration is a Date object, not a string
        expect(result.credentials.expiration).toBeInstanceOf(Date);
      });
    });

    describe('cacheRoleCredentials behavior', () => {
      it('should cache credentials in flat format (not nested)', async () => {
        fs_mock.existsSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('.amplify')) return false; // no existing cache
            return true;
          }
          return false;
        });
        fs_mock.readFileSync.mockImplementation((path: unknown) => {
          if (typeof path === 'string') {
            if (path.includes('config')) return roleProfileConfig;
            if (path.includes('credentials')) return sourceProfileCredentials;
          }
          return '';
        });

        mockSTSSend.mockResolvedValue({
          Credentials: {
            AccessKeyId: 'AKIAIOSFODNN7ASSUMED',
            SecretAccessKey: 'assumedSecretKey',
            SessionToken: 'assumedSessionToken',
            Expiration: futureExpiration,
          },
        });

        await getProfiledAwsConfig(context_stub, 'testrole');

        // Verify credentials were cached in flat format
        expect(JSONUtilitiesMock.writeJson).toHaveBeenCalled();
        const writeCall = JSONUtilitiesMock.writeJson.mock.calls[0];
        const cachedData = writeCall[1];

        // The cached credentials should be flat (accessKeyId at top level)
        // NOT nested ({ credentials: { accessKeyId: ... } })
        expect(cachedData[mockRoleArn][mockSessionName].accessKeyId).toBe('AKIAIOSFODNN7ASSUMED');
        expect(cachedData[mockRoleArn][mockSessionName].credentials).toBeUndefined();
      });
    });
  });
});
