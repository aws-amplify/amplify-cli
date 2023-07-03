const configHelper = require('../lib/amplify-config-helper');
const fs = require('fs');
const { readJsonFromDart } = require('../lib/dart-fs');

describe('customer pinpoint configuration', () => {
  it('generates correct notifications channel pinpoint configuration', () => {
    const amplifyMeta = {
      notifications: {
        amplifyplayground: {
          service: 'Pinpoint',
          output: {
            Region: 'us-east-1',
            InAppMessaging: {
              Enabled: true,
              ApplicationId: 'fake',
            },
            SMS: {
              ApplicationId: 'fake',
              Enabled: true,
            },
          },
        },
      },
    };
    const amplifyConfiguration = {};
    configHelper.constructNotifications(amplifyMeta, amplifyConfiguration);

    const expectedAmplifyConfiguration = {
      notifications: {
        plugins: {
          awsPinpointSmsNotificationsPlugin: {
            appId: 'fake',
            region: 'us-east-1',
          },
          awsPinpointInAppMessagingNotificationsPlugin: {
            appId: 'fake',
            region: 'us-east-1',
          },
        },
      },
    };
    expect(amplifyConfiguration).toMatchObject(expectedAmplifyConfiguration);
  });
});

describe('Dart configuration file', () => {
  let tmpDir;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync('amplify-frontend-flutter');
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  const writeTempConfig = (config) => {
    const filepath = `${tmpDir}/amplifyconfiguration.dart`;
    fs.writeFileSync(filepath, config);
    return filepath;
  };

  const parseConfig = (config) => {
    const configPath = writeTempConfig(config);
    return readJsonFromDart(configPath);
  };

  it('parses old format', () => {
    const parsedConfig = parseConfig(`const amplifyconfig = ''' {
    "UserAgent": "aws-amplify-cli/2.0",
    "Version": "1.0"
}''';`);
    expect(parsedConfig).toMatchObject({
      UserAgent: 'aws-amplify-cli/2.0',
      Version: '1.0',
    });
  });

  it('parses new format', () => {
    const parsedConfig = parseConfig(`const amplifyconfig = '''{
      "UserAgent": "aws-amplify-cli/2.0",
      "Version": "1.0"
  }''';`);
    expect(parsedConfig).toMatchObject({
      UserAgent: 'aws-amplify-cli/2.0',
      Version: '1.0',
    });
  });

  it('parses with data before', () => {
    const parsedConfig = parseConfig(`
    const someOtherConfig = '{}';

    const amplifyconfig = '''{
        "UserAgent": "aws-amplify-cli/2.0",
        "Version": "1.0"
    }''';`);
    expect(parsedConfig).toMatchObject({
      UserAgent: 'aws-amplify-cli/2.0',
      Version: '1.0',
    });
  });

  it('parses with data after', () => {
    const parsedConfig = parseConfig(`
  const amplifyconfig = '''{
        "UserAgent": "aws-amplify-cli/2.0",
        "Version": "1.0"
    }''';
    
    const someOtherConfig = {};`);
    expect(parsedConfig).toMatchObject({
      UserAgent: 'aws-amplify-cli/2.0',
      Version: '1.0',
    });
  });
});
