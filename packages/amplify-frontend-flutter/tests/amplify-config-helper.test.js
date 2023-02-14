const configHelper = require('../lib/amplify-config-helper');

describe('customer pinpoint configuration', () => {
  it('generates correct notifications channel pinpoint configuration', () => {
    const amplifyMeta = {
      'notifications': {
        'amplifyplayground': {
          'service': 'Pinpoint',
          'output': {
            'Region': 'us-east-1',
            'InAppMessaging': {
              'Enabled': true,
              'ApplicationId': 'fake'
            },
            'SMS': {
              'ApplicationId': 'fake',
              'Enabled': true,
            }
          },
        }
      }
    };
    const amplifyConfiguration = {};
    configHelper.constructNotifications(amplifyMeta, amplifyConfiguration);

    const expectedAmplifyConfiguration = {
      notifications: {
        plugins: {
          awsPinpointSmsNotificationsPlugin: {
            appId: 'fake',
            region: 'us-east-1'
          },
          awsPinpointInAppMessagingNotificationsPlugin: {
            appId: 'fake',
            region: 'us-east-1'
          }
        }
      }
    }
    expect(amplifyConfiguration).toMatchObject(expectedAmplifyConfiguration)
  });
});
