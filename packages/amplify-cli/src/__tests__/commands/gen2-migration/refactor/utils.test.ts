import { extractStackNameFromId, shortenStackName } from '../../../../commands/gen2-migration/refactor/utils';

describe('extractStackNameFromId', () => {
  it('extracts stack name from ARN', () => {
    expect(extractStackNameFromId('arn:aws:cloudformation:us-east-1:123456789:stack/my-stack-name')).toBe('my-stack-name');
  });

  it('returns plain stack name as-is', () => {
    expect(extractStackNameFromId('my-stack-name')).toBe('my-stack-name');
  });

  it('extracts second segment from ARN with multiple slashes', () => {
    expect(extractStackNameFromId('arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc-def-guid')).toBe('my-stack');
  });
});

describe('shortenStackName', () => {
  it('extracts category/resource from standard Amplify stack name', () => {
    expect(shortenStackName('amplify-d2qzwxyz6oexq-dev-storageawards-ABCDEF1234')).toBe('storageawards');
  });

  it('preserves hyphens in the middle segment', () => {
    expect(shortenStackName('amplify-d2qzwxyz6oexq-dev-auth-UserPool-ABC123')).toBe('auth-UserPool');
  });

  it('returns full name for non-Amplify stack names', () => {
    expect(shortenStackName('my-custom-stack')).toBe('my-custom-stack');
  });

  it('returns full name when name has fewer than 5 segments', () => {
    expect(shortenStackName('amplify-short-name')).toBe('amplify-short-name');
  });

  it('handles holding stack names', () => {
    // Holding stack: amplify-...-<category>-<hash>-holding → strips first 3 and last segment
    expect(shortenStackName('amplify-d2qzwxyz6oexq-dev-storage0EC3F24A-ABC123-holding')).toBe('storage0EC3F24A-ABC123');
  });
});
