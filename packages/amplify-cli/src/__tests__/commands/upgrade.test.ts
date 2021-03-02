import execa from 'execa';
import { run } from '../../commands/upgrade';
import { $TSContext } from 'amplify-cli-core';

jest.mock('execa');
const execa_mock = execa as jest.Mocked<typeof execa>;

const context_stub = {
  print: {
    warning: jest.fn(),
    info: jest.fn(),
  },
};

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getHomeDotAmplifyDirPath: jest.fn().mockReturnValue('homedir'),
  },
  isPackaged: false,
}));

jest.mock('chalk', () => ({
  blueBright: jest.fn().mockImplementation(input => input),
}));

const context_stub_typed = (context_stub as unknown) as $TSContext;

describe('run upgrade using node CLI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('doesnt do anything when running using node', async () => {
    // setup
    execa_mock.command.mockResolvedValueOnce({ stdout: '1.0.0' } as any);

    // test
    await run(context_stub_typed);

    // validate
    expect(context_stub.print.warning.mock.calls[0][0]).toMatchInlineSnapshot(
      `"\\"upgrade\\" is not supported in this installation of Amplify."`,
    );
    expect(context_stub.print.info.mock.calls[0][0]).toMatchInlineSnapshot(`"Use npm i -g @aws-amplify/cli instead."`);
  });
});
