import { printer } from 'amplify-prompts';
import { showDefaultIdentityClaimWarning } from '../../utils/warnings';

jest.mock('amplify-prompts', () => ({
  printer: {
    warn: jest.fn(),
  },
}));

describe('showDefaultIdentityClaimWarning', () => {
  describe('owner based @auth', () => {
    describe('feature flag enabled w/o custom identity claim', () => {
      test('does not show message', () => {
        const context: any = {
          featureFlags: {
            getBoolean: () => true,
            getNumber: jest.fn(),
            getString: jest.fn(),
            getObject: jest.fn(),
          },
        };

        showDefaultIdentityClaimWarning(context, [{ allow: 'owner' }]);

        expect(printer.warn).not.toBeCalled();
      });
    });

    describe('feature flag enabled w/ custom identity claim', () => {
      describe('with default cognito identity claim', () => {
        test('does not show message', () => {
          const context: any = {
            featureFlags: {
              getBoolean: () => true,
              getNumber: jest.fn(),
              getString: jest.fn(),
              getObject: jest.fn(),
            },
          };
          showDefaultIdentityClaimWarning(context, [{ allow: 'owner', identityClaim: 'cognito:username' }]);

          expect(printer.warn).not.toBeCalled();
        });
      });

      describe('with default identity claim', () => {
        test('does not show message', () => {
          const context: any = {
            featureFlags: {
              getBoolean: () => true,
              getNumber: jest.fn(),
              getString: jest.fn(),
              getObject: jest.fn(),
            },
          };
          showDefaultIdentityClaimWarning(context, [{ allow: 'owner', identityClaim: 'username' }]);

          expect(printer.warn).not.toBeCalled();
        });
      });
    });

    describe('feature flag disabled w/ custom identity claim', () => {
      describe('with default cognito identity claim', () => {
        test('does not show message', () => {
          const context: any = {
            featureFlags: {
              getBoolean: () => false,
              getNumber: jest.fn(),
              getString: jest.fn(),
              getObject: jest.fn(),
            },
          };
          showDefaultIdentityClaimWarning(context, [{ allow: 'owner', identityClaim: 'cognito:username' }]);

          expect(printer.warn).not.toBeCalled();
        });
      });

      describe('with default identity claim', () => {
        test('does not show message', () => {
          const context: any = {
            featureFlags: {
              getBoolean: () => false,
              getNumber: jest.fn(),
              getString: jest.fn(),
              getObject: jest.fn(),
            },
          };
          showDefaultIdentityClaimWarning(context, [{ allow: 'owner', identityClaim: 'username' }]);

          expect(printer.warn).not.toBeCalled();
        });
      });
    });

    describe('feature flag disabled w/o custom identity claim', () => {
      test('does show message', () => {
        const context: any = {
          featureFlags: {
            getBoolean: () => false,
            getNumber: jest.fn(),
            getString: jest.fn(),
            getObject: jest.fn(),
          },
        };
        showDefaultIdentityClaimWarning(context, [{ allow: 'owner' }]);

        expect(printer.warn).toBeCalledTimes(1);
        expect(printer.warn).toBeCalledWith(
          ' WARNING: Amplify CLI will change the default identity claim from \'username\' '
            + 'to use \'sub::username\'. To continue using only usernames, set \'identityClaim: "username"\' on your '
            + '\'owner\' rules on your schema. The default will be officially switched with v9.0.0. To read '
            + 'more: https://docs.amplify.aws/cli/migration/identity-claim-changes/',
        );
      });
    });
  });
});
