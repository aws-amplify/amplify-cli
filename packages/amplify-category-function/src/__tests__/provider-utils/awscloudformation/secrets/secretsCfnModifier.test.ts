import { secretsPathAmplifyAppIdKey } from '../../../../provider-utils/awscloudformation/secrets/secretName';
import { updateSecretsInCfnTemplate } from '../../../../provider-utils/awscloudformation/secrets/secretsCfnModifier';
import Template from 'cloudform-types/types/template';

jest.mock('../../../../provider-utils/awscloudformation/secrets/secretName');

describe('updateSecretsInCfnTemplate', () => {
  const testTemplate = ({
    Parameters: {},
    Resources: {
      LambdaFunction: {
        Properties: {
          Environment: {
            Variables: {},
          },
        },
      },
    },
  } as unknown) as Template;
  it('sets Amplify AppId in parameters if secrets are present', async () => {
    const output = await updateSecretsInCfnTemplate(testTemplate, { TEST_SECRET: { operation: 'retain' } }, 'testFunc');
    expect(output.Parameters[secretsPathAmplifyAppIdKey]).toBeDefined();
  });

  it('removes Amplify AppId parameter if no secrets are present', async () => {
    const output = await updateSecretsInCfnTemplate(testTemplate, { TEST_SECRET: { operation: 'remove' } }, 'testFunc');
    expect(output.Parameters[secretsPathAmplifyAppIdKey]).toBeUndefined();
  });
});
