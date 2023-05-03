import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { run } from '../../commands/uninstall';
import execa from 'execa';

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;
execa_mock.command.mockResolvedValue({} as any);

let userConfirmation = true;
const context_stub = {
  amplify: {
    confirmPrompt: async () => userConfirmation,
  },
  print: {
    info: jest.fn(),
    warning: jest.fn(),
    success: jest.fn(),
  },
};

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir/.amplify'),
  },
  isPackaged: false,
}));

jest.mock('chalk', () => ({
  blueBright: jest.fn().mockImplementation((input) => input),
}));

const context_stub_typed = context_stub as unknown as $TSContext;

describe('uninstall node CLI', () => {
  afterEach(() => {
    userConfirmation = true;
  });
  it('does nothing when running using node', async () => {
    await run(context_stub_typed);

    expect(context_stub.print.warning.mock.calls[0][0]).toMatchInlineSnapshot(
      `""uninstall" is not available in this installation of Amplify."`,
    );
    expect(context_stub.print.info.mock.calls[0][0]).toMatchInlineSnapshot(`"Use npm uninstall -g @aws-amplify/cli instead."`);
  });
});
