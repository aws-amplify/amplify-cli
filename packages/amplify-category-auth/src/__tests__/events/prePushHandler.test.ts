import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { prePushHandler } from '../../events/prePushHandler';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

jest.mock('../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state');
jest.mock('../../utils/getAuthResourceName');

let cliInputExists = false;

const AuthInputStateMock = AuthInputState as jest.MockedClass<typeof AuthInputState>;
AuthInputStateMock.mockImplementation(
  () =>
    ({
      cliInputFileExists: jest.fn().mockReturnValue(cliInputExists),
    } as unknown as AuthInputState),
);

describe('prePushHandler', () => {
  it('throws migration error if cli-inputs.json does not exist', async () => {
    await expect(prePushHandler({} as $TSContext)).rejects.toMatchInlineSnapshot(
      `[InvalidMigrationError: Auth configuration needs to be migrated before pushing.]`,
    );
  });
});
