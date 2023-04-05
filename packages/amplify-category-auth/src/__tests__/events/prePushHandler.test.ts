import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { prePushHandler } from '../../events/prePushHandler';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { projectHasAuth } from '../../provider-utils/awscloudformation/utils/project-has-auth';
import { legacyAuthConfigHasTriggers } from '../../utils/legacyAuthConfigHasTriggers';

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');
jest.mock('../../utils/getAuthResourceName');
jest.mock('../../provider-utils/awscloudformation/utils/project-has-auth');
jest.mock('../../utils/legacyAuthConfigHasTriggers');

const cliInputFileExistsMock = jest.fn().mockReturnValue(false);

const AuthInputStateMock = AuthInputState as jest.MockedClass<typeof AuthInputState>;
AuthInputStateMock.mockImplementation(
  () =>
    ({
      cliInputFileExists: cliInputFileExistsMock,
    } as unknown as AuthInputState),
);

const getImportedAuthPropertiesMock = jest.fn().mockReturnValue({ imported: false });
const contextStub = {
  amplify: {
    getImportedAuthProperties: getImportedAuthPropertiesMock,
  },
} as unknown as $TSContext;

const legacyAuthConfigHasTriggersMock = legacyAuthConfigHasTriggers as jest.MockedFunction<typeof legacyAuthConfigHasTriggers>;
legacyAuthConfigHasTriggersMock.mockReturnValue(true);

const projectHasAuthMock = projectHasAuth as jest.MockedFunction<typeof projectHasAuth>;
projectHasAuthMock.mockReturnValue(true);

// all of the mocks are initially set up to cause the handler to fall through to the error case
// individual tests set mocks to other values to trip early return cases
describe('prePushHandler', () => {
  it('does nothing if project does not have auth', async () => {
    projectHasAuthMock.mockReturnValueOnce(false);
    await expect(prePushHandler(contextStub)).resolves;
  });

  it('does nothing if project has imported auth', async () => {
    getImportedAuthPropertiesMock.mockReturnValueOnce({ imported: true });
    await expect(prePushHandler(contextStub)).resolves;
  });

  it('does nothing if auth is already using new format', async () => {
    cliInputFileExistsMock.mockReturnValueOnce(true);
    await expect(prePushHandler(contextStub)).resolves;
  });

  it('does nothing if auth is using old format but does not have triggers', async () => {
    legacyAuthConfigHasTriggersMock.mockReturnValueOnce(false);
    await expect(prePushHandler(contextStub)).resolves;
  });

  it('throws migration error if auth is using old format and has triggers', async () => {
    await expect(prePushHandler(contextStub)).rejects.toMatchInlineSnapshot(
      `[InvalidMigrationError: Auth triggers have been configured using an older version of the CLI and must be migrated before they can be deployed.]`,
    );
  });
});
