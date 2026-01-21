import fs from 'fs-extra';
import { spawnSync, SpawnSyncReturns } from 'child_process';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';
import { run } from '../apns-cert-p12decoder';

jest.mock('fs-extra');
jest.mock('child_process');

const fsMock = fs as jest.Mocked<typeof fs>;
const spawnSyncMock = spawnSync as jest.MockedFunction<typeof spawnSync>;

describe('apns-cert-p12decoder', () => {
  const mockFilePath = '/path/to/cert.p12';
  const mockPassword = 'test-password';
  const mockInfo = {
    P12FilePath: mockFilePath,
    P12FilePassword: mockPassword,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fsMock.existsSync.mockReturnValue(true);
  });

  describe('run', () => {
    const mockCertificate = 'MIIC+zCCAeOgAwIBAgIJALZM';
    const mockPrivateKey = 'MIIEvgIBADANBgkqhkiG9w0B';

    const createPemContent = (certContent: string, keyContent: string, keyType = 'PRIVATE KEY'): string => {
      return `-----BEGIN CERTIFICATE-----
${certContent}
-----END CERTIFICATE-----
-----BEGIN ${keyType}-----
${keyContent}
-----END ${keyType}-----`;
    };

    it('should extract certificate and private key from PEM content', () => {
      const pemContent = createPemContent(mockCertificate, mockPrivateKey);

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContent);

      const result = run(mockInfo);

      expect(spawnSyncMock).toHaveBeenCalledWith(
        'openssl',
        ['pkcs12', '-in', mockFilePath, '-out', expect.any(String), '-nodes', '-passin', 'stdin'],
        { input: mockPassword, encoding: 'utf8' },
      );
      expect(result.Certificate).toContain('-----BEGIN CERTIFICATE-----');
      expect(result.Certificate).toContain('-----END CERTIFICATE-----');
      expect(result.PrivateKey).toContain('-----BEGIN PRIVATE KEY-----');
      expect(result.PrivateKey).toContain('-----END PRIVATE KEY-----');
      expect(fsMock.removeSync).toHaveBeenCalled();
    });

    it('should extract RSA private key when standard private key is not found', () => {
      const pemContent = createPemContent(mockCertificate, mockPrivateKey, 'RSA PRIVATE KEY');

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContent);

      const result = run(mockInfo);

      expect(result.PrivateKey).toContain('-----BEGIN RSA PRIVATE KEY-----');
      expect(result.PrivateKey).toContain('-----END RSA PRIVATE KEY-----');
    });

    it('should extract encrypted private key as fallback', () => {
      const pemContent = createPemContent(mockCertificate, mockPrivateKey, 'ENCRYPTED PRIVATE KEY');

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContent);

      const result = run(mockInfo);

      expect(result.PrivateKey).toContain('-----BEGIN ENCRYPTED PRIVATE KEY-----');
      expect(result.PrivateKey).toContain('-----END ENCRYPTED PRIVATE KEY-----');
    });

    it('should throw AmplifyError when openssl command fails to spawn', () => {
      spawnSyncMock.mockReturnValue({
        status: null,
        error: new Error('spawn openssl ENOENT'),
        stderr: '',
      } as SpawnSyncReturns<string>);

      const amplifyError = new AmplifyError('OpenSslCertificateError', {
        message: 'OpenSSL command failed: spawn openssl ENOENT',
        resolution: 'Ensure OpenSSL is installed and accessible in your PATH',
      });

      expect(() => run(mockInfo)).toThrow(amplifyError);
    });

    it('should throw AmplifyError when openssl returns non-zero exit code', () => {
      spawnSyncMock.mockReturnValue({
        status: 1,
        error: undefined,
        stderr: 'Mac verify error: invalid password?',
      } as SpawnSyncReturns<string>);

      const amplifyError = new AmplifyError('OpenSslCertificateError', {
        message: 'OpenSSL failed to process the p12 file: Mac verify error: invalid password?',
        resolution: 'Check the p12 file and password and try again',
      });

      expect(() => run(mockInfo)).toThrow(amplifyError);
    });

    it('should throw AmplifyError when certificate cannot be extracted', () => {
      const pemContentNoCert = `-----BEGIN PRIVATE KEY-----
${mockPrivateKey}
-----END PRIVATE KEY-----`;

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContentNoCert);

      const amplifyError = new AmplifyError('OpenSslCertificateError', {
        message: 'OpenSSL can not extract the Certificate from the p12 file',
        resolution: 'Check the p12 file and password and try again',
      });

      expect(() => run(mockInfo)).toThrow(amplifyError);
    });

    it('should throw AmplifyError when private key cannot be extracted', () => {
      const pemContentNoKey = `-----BEGIN CERTIFICATE-----
${mockCertificate}
-----END CERTIFICATE-----`;

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContentNoKey);

      const amplifyError = new AmplifyError('OpenSslCertificateError', {
        message: 'OpenSSL can not extract the Private Key from the p12 file',
        resolution: 'Check the p12 file and password and try again',
      });

      expect(() => run(mockInfo)).toThrow(amplifyError);
    });

    it('should pass password via stdin to prevent exposure in process listing', () => {
      const maliciousPassword = '; rm -rf / ; echo "pwned"';
      const maliciousInfo = {
        P12FilePath: mockFilePath,
        P12FilePassword: maliciousPassword,
      };
      const pemContent = createPemContent(mockCertificate, mockPrivateKey);

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContent);

      run(maliciousInfo);

      // Verify the password is passed via stdin, not as a command line argument
      expect(spawnSyncMock).toHaveBeenCalledWith(
        'openssl',
        ['pkcs12', '-in', mockFilePath, '-out', expect.any(String), '-nodes', '-passin', 'stdin'],
        { input: maliciousPassword, encoding: 'utf8' },
      );
    });

    it('should cleanup temp file even when an error is thrown', () => {
      spawnSyncMock.mockReturnValue({
        status: 1,
        error: undefined,
        stderr: 'error',
      } as SpawnSyncReturns<string>);

      const amplifyError = new AmplifyError('OpenSslCertificateError', {
        message: 'OpenSSL failed to process the p12 file: error',
        resolution: 'Check the p12 file and password and try again',
      });

      expect(() => run(mockInfo)).toThrow(amplifyError);
      expect(fsMock.existsSync).toHaveBeenCalled();
      expect(fsMock.removeSync).toHaveBeenCalled();
    });

    it('should not attempt to remove temp file if it does not exist', () => {
      const pemContent = createPemContent(mockCertificate, mockPrivateKey);

      spawnSyncMock.mockReturnValue({
        status: 0,
        error: undefined,
        stderr: '',
      } as SpawnSyncReturns<string>);
      fsMock.readFileSync.mockReturnValue(pemContent);
      fsMock.existsSync.mockReturnValue(false);

      run(mockInfo);

      expect(fsMock.existsSync).toHaveBeenCalled();
      expect(fsMock.removeSync).not.toHaveBeenCalled();
    });
  });
});
