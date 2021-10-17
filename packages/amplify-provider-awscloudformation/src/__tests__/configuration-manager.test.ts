import { $TSContext } from 'amplify-cli-core';
import { enableServerlessContainers } from '../configuration-manager';

jest.setTimeout(15000);

jest.mock('../utils/aws-logger', () => ({
  fileLogger: () => jest.fn(() => jest.fn()),
}));

const frontend = 'javascript';
const context_stub = ({
  print: {
    info: jest.fn(),
  },
  // Mock construction of exeInfo
  exeInfo: { projectConfig: { frontend, [frontend]: { config: {} } } },
  input: { options: { yes: false } },
} as unknown) as jest.Mocked<$TSContext>;

describe('enableServerlessContainers', () => {
  it('should prompt for a ServerlessContainers value when `--yes` is NOT present', async () => {
    context_stub.input.options.yes = false;
    let prompt = enableServerlessContainers(context_stub);
    // Mock user response
    process.stdin.push('y\n');
    await prompt;

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(true);
  });

  it('should use passed or default ServerlessContainers option when `--yes` is present.', async () => {
    context_stub.input.options.yes = true;
    context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers = false;

    await enableServerlessContainers(context_stub);

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(false);
  });

  it('should set ServerlessContainers to `false` by default when `--yes` is present, but there is no passed/default value', async () => {
    context_stub.input.options.yes = true;
    context_stub.exeInfo.projectConfig[frontend].config = {};

    await enableServerlessContainers(context_stub);

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(false);
  });
});
