import { printer } from 'amplify-prompts';
import { showBuildDirChangesMessage } from '../../utils/auto-updates';

const cloudBackendCfnTemplatePath = '/amplify/#cloud-backend/auth/cognito/build/cognito-cloudformation-template.json';
const backendCfnTemplatePath = '/amplify/backend/auth/cognito/build/cognito-cloudformation-template.json';

let setInCloudBackendDir: boolean;
let setInBackendDir: boolean;

jest.mock('amplify-prompts');
jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn().mockImplementation(path => {
      const cfnTemplate = {
        Resources: {
          UserPool: {
            Properties: {},
          },
        },
      };
      if ((path === cloudBackendCfnTemplatePath && setInCloudBackendDir) || (path === backendCfnTemplatePath && setInBackendDir)) {
        cfnTemplate.Resources.UserPool.Properties = {
          UserAttributeUpdateSettings: {
            AttributesRequireVerificationBeforeUpdate: [
              'email',
            ],
          },
        };
      }
      return cfnTemplate;
    }),
  },
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('/amplify/backend'),
    getCurrentCloudBackendDirPath: jest.fn().mockReturnValue('/amplify/#cloud-backend'),
  },
  stateManager: {
    getMeta: jest.fn().mockReturnValue({
      auth: {
        cognito: {
          service: 'Cognito',
        },
      },
    }),
    getResourceFromMeta: jest.fn().mockReturnValue({ resourceName: 'cognito' }),
  },
}));

describe('showBuildDirChangesMessage', () => {
  const printerMock = printer as jest.Mocked<typeof printer>;

  beforeEach(() => {
    printerMock.warn = jest.fn();
  });

  afterEach(() => {
    printerMock.warn.mockReset();
  });

  describe('warning message for UserAttributeUpdateSettings addition for cognito', () => {
    describe('#cloud-backend has UserAttributeUpdateSettings', () => {
      beforeEach(() => {
        setInCloudBackendDir = true;
        setInBackendDir = true;
      });

      it('does not call warn', async () => {
        await showBuildDirChangesMessage();
        expect(printerMock.warn).not.toBeCalled();
      });
    });

    describe('#cloud-backend does not have UserAttributeUpdateSettings', () => {
      describe('backend dir does have UserAttributeUpdateSettings', () => {
        beforeEach(() => {
          setInCloudBackendDir = false;
          setInBackendDir = true;
        });

        it('does call warn', async () => {
          await showBuildDirChangesMessage();
          expect(printerMock.warn).toBeCalledWith(
            `We now support verifying a Cognito user email address that has been changed and are updating your auth configuration. Read more: \
https://docs.amplify.aws/lib/auth/manageusers/q/platform/js/#updating-and-verifying-a-cognito-user-email-address`,
          );
        });
      });

      describe('backend dir does not have UserAttributeUpdateSettings', () => {
        beforeEach(() => {
          setInCloudBackendDir = false;
          setInBackendDir = false;
        });

        it('does not call warn', async () => {
          await showBuildDirChangesMessage();
          expect(printerMock.warn).not.toBeCalled();
        });
      });
    });
  });
});
