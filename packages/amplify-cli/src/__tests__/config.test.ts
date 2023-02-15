import * as fs from 'fs-extra';
import { init } from '../app-config';
import { Context } from '../domain/context';
import { CommandLineInput } from 'amplify-cli-core';

describe('test usageData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockContext: Context = jest.genMockFromModule('../domain/context');
  mockContext.input = new CommandLineInput([
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'status',
  ]);
  mockContext.amplify = jest.genMockFromModule('../domain/amplify-toolkit');
  mockContext.print = {
    warning: jest.fn(),
  };
  test('case: valid Json', () => {
    (fs.existsSync as any).mockReturnValue(true);
    const installationUuid = 'testuuid';
    (fs.readFileSync as any).mockReturnValue(
      `{"usageDataConfig":{"installationUuid":"${installationUuid}","isUsageTrackingEnabled":true}}`,
    );

    const config = init(mockContext);

    expect(config.usageDataConfig.installationUuid).toEqual(installationUuid);
  });

  test('case: Invalid json', () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.writeFile as any).mockReturnValue();
    (fs.readFileSync as any).mockReturnValue(`{"usageDataConfig":{"installationUuid,"isUsageTrackingEnabled":true}}`);

    const config = init(mockContext);

    expect(mockContext.print.warning).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(config.usageDataConfig).toBeDefined();
  });
});
