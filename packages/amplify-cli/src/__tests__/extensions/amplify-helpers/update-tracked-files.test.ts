import fs from 'fs-extra';
import { updateCognitoTrackedFiles } from '../../../extensions/amplify-helpers/update-tracked-files';

const cloudBackendCfnTemplatePath = '/amplify/#cloud-backend/auth/cognito/build/cognito-cloudformation-template.json';
const backendCfnTemplatePath = '/amplify/backend/auth/cognito/build/cognito-cloudformation-template.json';
const cliInputsFile = '/amplify/backend/auth/cognito/cli-inputs.json';

let cloudBackendExists: boolean;
let setInCloudBackendDir: boolean;

jest.mock('@aws-amplify/amplify-cli-core', () => {
  const { stateManager } = jest.requireActual('@aws-amplify/amplify-cli-core');

  return {
    JSONUtilities: {
      readJson: jest.fn().mockImplementation((path) => {
        const cfnTemplate = {
          Resources: {
            UserPool: {
              Properties: {},
            },
          },
        };

        if ((path === cloudBackendCfnTemplatePath && setInCloudBackendDir) || path === backendCfnTemplatePath) {
          cfnTemplate.Resources.UserPool.Properties = {
            UserAttributeUpdateSettings: {
              AttributesRequireVerificationBeforeUpdate: ['email'],
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

describe('updateCognitoTrackedFiles', () => {
  const fsMock = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    fsMock.existsSync = jest.fn().mockImplementation((path) => {
      if (path === '/amplify/#cloud-backend') {
        return cloudBackendExists;
      }
      return true;
    });

    fsMock.appendFile = jest.fn();
  });

  afterEach(() => {
    fsMock.existsSync.mockReset();
    fsMock.appendFile.mockReset();

    cloudBackendExists = false;
    setInCloudBackendDir = false;
  });

  describe('when backend and cloud backend do not match', () => {
    beforeEach(() => {
      cloudBackendExists = true;
      setInCloudBackendDir = false;
    });

    it('appends white space', async () => {
      await updateCognitoTrackedFiles();
      expect(fsMock.appendFile).toHaveBeenCalledTimes(1);
      expect(fsMock.appendFile).toBeCalledWith(cliInputsFile, ' ');
    });
  });

  describe('when backend and cloud backend do match', () => {
    beforeEach(() => {
      cloudBackendExists = true;
      setInCloudBackendDir = true;
    });

    it('does not append white space', async () => {
      await updateCognitoTrackedFiles();
      expect(fsMock.appendFile).toHaveBeenCalledTimes(0);
    });
  });

  describe('when cloud backend does not exist', () => {
    beforeEach(() => {
      cloudBackendExists = false;
    });

    it('does not append white space', async () => {
      await updateCognitoTrackedFiles();
      expect(fsMock.appendFile).toHaveBeenCalledTimes(0);
    });
  });
});
