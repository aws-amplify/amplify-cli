import { extractApplePrivateKey } from '../../../../provider-utils/awscloudformation/utils/extract-apple-private-key';

describe('When extracting apple private key...', () => {
  const expectedOutput =
    'MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadYiCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIfTT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6y89bWcNw';

  it('it should remove new lines and space and comments', () => {
    const input = `-----BEGIN PRIVATE KEY-----
        MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadY
        iCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIf
        TT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6
        y89bWcNw
        -----END PRIVATE KEY-----`;
    expect(extractApplePrivateKey(input)).toEqual(expectedOutput);
  });

  it('it should not alter a pre extracted key', () => {
    const input = expectedOutput;
    expect(extractApplePrivateKey(input)).toEqual(expectedOutput);
  });
});
