import { extractStackNameFromId } from '../../../../commands/gen2-migration/refactor/utils';

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
