import { $TSContext, open } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { run } from '../setup-new-user';

const context_stub = {
  print: {
    info: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
  amplify: {
    makeId: jest.fn(),
    pressEnterToContinue: {
      run: jest.fn().mockReturnValue(new Promise((resolve) => resolve(true))),
    },
  },
} as unknown as jest.Mocked<$TSContext>;

jest.mock('@aws-amplify/amplify-cli-core', () => ({
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

jest.mock('@aws-amplify/amplify-prompts');
const printerMock = printer as jest.Mocked<typeof printer>;

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
  it('should open console link and docs link', async () => {
    await run(context_stub);
    expect(open).toBeCalledWith('https://console.aws.amazon.com/iamv2/home#/users/create', { wait: false });
    expect(open).toBeCalledWith('https://docs.amplify.aws/cli/start/install/#configure-the-amplify-cli', { wait: false });
  });

  it('should print console link and docs link', async () => {
    await run(context_stub);
    expect(printerMock.info).toBeCalledWith('https://console.aws.amazon.com/iamv2/home#/users/create', 'blue');
    expect(printerMock.info).toBeCalledWith('https://docs.amplify.aws/cli/start/install/#configure-the-amplify-cli', 'blue');
  });
});
