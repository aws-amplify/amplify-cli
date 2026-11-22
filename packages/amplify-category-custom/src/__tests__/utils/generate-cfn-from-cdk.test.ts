import { getCDKProps } from '../../utils/generate-cfn-from-cdk';

describe('generate-cfn-from-cdk', () => {
  describe('getCDKProps', () => {
    beforeEach(() => {
      process.env = {};
    });

    test('should return undefined if CDK env vars are not set', () => {
      const actual = getCDKProps();
      expect(Object.values(actual)).toHaveLength(0);
    });

    test('should return cdk props with env set', () => {
      process.env = {
        CDK_DEFAULT_ACCOUNT: 'some_account_id',
        CDK_DEFAULT_REGION: 'us-east-1',
      };

      const actual = getCDKProps();

      expect(actual.env?.account).toEqual('some_account_id');
      expect(actual.env?.region).toEqual('us-east-1');
    });
  });
});
