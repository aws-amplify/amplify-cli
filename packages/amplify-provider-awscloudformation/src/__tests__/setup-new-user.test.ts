import { $TSContext, open } from 'amplify-cli-core';
import { run } from '../setup-new-user';

const context_stub = ({
  print: {
    info: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
  amplify: {
    makeId: jest.fn(),
    pressEnterToContinue: {
      run: jest.fn().mockReturnValue(new Promise(resolve => resolve(true))),
    },
  },
} as unknown) as jest.Mocked<$TSContext>;

jest.mock('amplify-cli-core', () => ({
  open: jest.fn().mockReturnValue(Promise.resolve()),
}));
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockReturnValue({
    pn: 'test',
    accessKeyId: 'test',
    secretAccessKey: 'test',
    userName: 'test',
    region: 'test',
  }),
}));
jest.mock('../system-config-manager', () => ({
  setProfile: jest.fn(),
}));
jest.mock('../utility-obfuscate');

describe('setupNewUser.run', () => {
  let originalPlatform;
  beforeAll(() => {
    originalPlatform = process.platform;
  });
  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });
  it('should print deepLinkURL', async () => {
    await run(context_stub);
    expect(
      open,
    ).toBeCalledWith(
      'https://console.aws.amazon.com/iam/home?region=test#/users$new?step=final&accessKey&userNames=test&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAdministratorAccess',
      { wait: false },
    );
  });
  it('should print deepLinkURL with backtick on win32', async () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
    await run(context_stub);
    expect(
      open,
    ).toBeCalledWith(
      'https://console.aws.amazon.com/iam/home?region=test#/users`$new?step=final&accessKey&userNames=test&permissionType=policies&policies=arn:aws:iam::aws:policy%2FAdministratorAccess',
      { wait: false },
    );
  });
});
