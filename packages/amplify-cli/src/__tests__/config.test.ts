import fs from 'fs-extra';
import { init } from '../app-config';
import { Context } from '../domain/context';
import { Input } from '../domain/input';
describe('test usageData', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockContext: Context = jest.genMockFromModule('../domain/context');
  mockContext.input = new Input([
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/node',
    '/Users/userName/.nvm/versions/node/v8.11.4/bin/amplify',
    'status',
  ]);
  mockContext.amplify = jest.genMockFromModule('../domain/amplify-toolkit');
  mockContext.print = {
    warning: jest.fn(),
  };
  test('case: valid Json', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    const installationUuid = 'testuuid';
    fs.readFileSync = jest
      .fn()
      .mockReturnValue(`{"usageDataConfig":{"installationUuid":"${installationUuid}","isUsageTrackingEnabled":true}}`);
    const config = init(mockContext);
    expect(config.usageDataConfig.installationUuid).toEqual(installationUuid);
  });

  test('case: Invalid json', () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.writeFile = jest.fn();
    fs.readFileSync = jest.fn().mockReturnValue(`{"usageDataConfig":{"installationUuid,"isUsageTrackingEnabled":true}}`);
    const config = init(mockContext);
    expect(mockContext.print.warning).toBeCalled();
    expect(fs.writeFileSync).toBeCalled();
    expect(config.usageDataConfig).toBeDefined();
  });
});
