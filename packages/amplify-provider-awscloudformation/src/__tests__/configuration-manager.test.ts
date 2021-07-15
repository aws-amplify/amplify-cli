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
} as unknown) as jest.Mocked<$TSContext>;

describe('frontend configuration', () => {
  it('should prompt for a ServerlessContainers value if no option or default is present', async () => {
    let prompt = enableServerlessContainers(context_stub);
    // Mock user response
    process.stdin.push('y\n');
    await prompt;

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(true);
  });

  it('should use passed or default ServerlessContainers option instead of prompting', async () => {
    context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers = false;

    await enableServerlessContainers(context_stub);

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(false);
  });
});
