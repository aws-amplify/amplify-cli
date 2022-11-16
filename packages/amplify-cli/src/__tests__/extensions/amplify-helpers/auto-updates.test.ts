import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { showBuildDirChangesMessage } from '../../../extensions/amplify-helpers/auto-updates';

const cloudBackendCfnTemplatePath = '/amplify/#cloud-backend/auth/cognito/build/cognito-cloudformation-template.json';
const backendCfnTemplatePath = '/amplify/backend/auth/cognito/build/cognito-cloudformation-template.json';

let setInCloudBackendDir: boolean;
let setInCloudBackendDirWithoutRequireVerification: boolean;
let setInBackendDir: boolean;

jest.mock('fs-extra');
const fsMock = fs as jest.Mocked<typeof fs>;
fsMock.existsSync.mockReturnValue(true);

jest.mock('amplify-prompts');
jest.mock('amplify-cli-core', () => {
  const { stateManager } = jest.requireActual('amplify-cli-core');

  return {
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

        if (path === cloudBackendCfnTemplatePath && setInCloudBackendDirWithoutRequireVerification) {
          cfnTemplate.Resources.UserPool.Properties = {
            UserAttributeUpdateSettings: {
              AttributesRequireVerificationBeforeUpdate: [],
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
      ...stateManager,
      getMeta: jest.fn().mockReturnValue({
        auth: {
          cognito: {
            service: 'Cognito',
          },
        },
      }),
    },
  };
});

describe('showBuildDirChangesMessage', () => {
  const printerMock = printer as jest.Mocked<typeof printer>;

  beforeEach(() => {
    printerMock.warn = jest.fn();
  });

  afterEach(() => {
    printerMock.warn.mockReset();

    setInCloudBackendDir = false;
    setInCloudBackendDirWithoutRequireVerification = false;
    setInBackendDir = false;

    fsMock.existsSync.mockReturnValue(true);
  });

  describe('project does not have auth in current-cloud-backend directory', () => {
    beforeEach(() => {
      setInCloudBackendDir = false;
      setInCloudBackendDirWithoutRequireVerification = false;
      setInBackendDir = true;

      fsMock.existsSync.mockReturnValue(false);
    });

    it('does not call warn', async () => {
      await showBuildDirChangesMessage();
      expect(printerMock.warn).not.toBeCalled();
    });
  });

  describe('project does not have auth AttributesRequireVerificationBeforeUpdate attribute in template', () => {
    beforeEach(() => {
      setInCloudBackendDir = false;
      setInCloudBackendDirWithoutRequireVerification = false;
      setInBackendDir = false;

      fsMock.existsSync.mockReturnValue(true);
    });

    it('does not call warn', async () => {
      await showBuildDirChangesMessage();
      expect(printerMock.warn).not.toBeCalled();
    });
  });

  describe('warning message for UserAttributeUpdateSettings addition for cognito', () => {
    describe('#cloud-backend has UserAttributeUpdateSettings', () => {
      describe('backend dir does have UserAttributeUpdateSettings', () => {
        beforeEach(() => {
          setInCloudBackendDir = true;
          setInBackendDir = true;
        });

        it('does not call warn', async () => {
          await showBuildDirChangesMessage();
          expect(printerMock.warn).not.toBeCalled();
        });
      });

      describe('backend dir does not have UserAttributeUpdateSettings', () => {
        beforeEach(() => {
          setInCloudBackendDir = true;
          setInBackendDir = false;
        });

        it('does not call warn', async () => {
          await showBuildDirChangesMessage();
          expect(printerMock.warn).not.toBeCalled();
        });
      });
    });

    describe('#cloud-backend has UserAttributeUpdateSettings and not AttributesRequireVerificationBeforeUpdate with "email"', () => {
      describe('backend dir does have UserAttributeUpdateSettings', () => {
        beforeEach(() => {
          setInCloudBackendDir = false;
          setInCloudBackendDirWithoutRequireVerification = true;
          setInBackendDir = true;
        });

        it('does call warn', async () => {
          await showBuildDirChangesMessage();
          expect(printerMock.warn).toBeCalledWith(
            `Amplify CLI now supports verifying a Cognito user email address that has been changed and will automatically update your auth \
configuration. Read more: https://docs.amplify.aws/lib/auth/manageusers/q/platform/js/#updating-and-verifying-a-cognito-user-email-address`,
          );
        });
      });

      describe('backend dir does not have UserAttributeUpdateSettings', () => {
        beforeEach(() => {
          setInCloudBackendDir = true;
          setInCloudBackendDirWithoutRequireVerification = true;
          setInBackendDir = false;
        });

        it('does not call warn', async () => {
          await showBuildDirChangesMessage();
          expect(printerMock.warn).not.toBeCalled();
        });
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
            `Amplify CLI now supports verifying a Cognito user email address that has been changed and will automatically update your auth \
configuration. Read more: https://docs.amplify.aws/lib/auth/manageusers/q/platform/js/#updating-and-verifying-a-cognito-user-email-address`,
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
