import { $TSContext } from 'amplify-cli-core';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { AttributeType } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
import { getAuthTriggerStackCfnParameters } from '../../../../provider-utils/awscloudformation/utils/get-auth-trigger-stack-cfn-parameters';

jest.mock('amplify-cli-core', () => ({
  ...jest.requireActual('amplify-cli-core'),
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockDirPath'),
  },
}));

describe('test auth trigger stack Parameters', () => {
  it('returns correct output when cli-inputs.json does not exist', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => false);
    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });
  it('creates sns Role Arn parameter when useEnabledMfa is false', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: false,
        requiredAttributes: ['mock'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
      },
    });

    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "snsRoleArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.CreatedSNSRole",
          ],
        },
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });

  it('creates sns Role Arn parameter when required attributes has phone_number enabled', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: true,
        requiredAttributes: ['phone_number'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
      },
    });

    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "snsRoleArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.CreatedSNSRole",
          ],
        },
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });

  it('creates sns Role Arn parameter when username attributes has phone_number enabled', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['mock'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: true,
        requiredAttributes: ['email'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.PHONE_NUMBER],
        serviceName: 'Cognito',
      },
    });

    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "snsRoleArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.CreatedSNSRole",
          ],
        },
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });

  it('creates sns Role Arn parameter when autoVerifiedAttributes attributes has phone_number enabled', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['phone_number'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: true,
        requiredAttributes: ['email'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
      },
    });

    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "snsRoleArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.CreatedSNSRole",
          ],
        },
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });

  it('creates sns Role Arn parameter when mfa configuration attributes has sms enabled', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['email'],
        mfaConfiguration: 'ON',
        useEnabledMfas: true,
        mfaTypes: ['SMS Text Message', 'TOTP'],
        requiredAttributes: ['email'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
      },
    });

    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "snsRoleArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.CreatedSNSRole",
          ],
        },
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });

  it('does not create sns Role Arn parameter when mfa enabled and configure sms option is false', async () => {
    const mockResourceName = 'mockResource';
    jest.spyOn(AuthInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
    jest.spyOn(AuthInputState.prototype, 'getCLIInputPayload').mockReturnValue({
      version: '1',
      cognitoConfig: {
        authSelections: 'identityPoolAndUserPool',
        autoVerifiedAttributes: ['email'],
        mfaConfiguration: 'OFF',
        useEnabledMfas: true,
        requiredAttributes: ['email'],
        resourceName: 'mockResource',
        useDefault: 'default',
        usernameAttributes: [AttributeType.EMAIL],
        serviceName: 'Cognito',
      },
    });

    const mockContext = {
      amplify: {},
      input: {
        options: {},
      },
    };
    const answers = await getAuthTriggerStackCfnParameters((mockContext as unknown) as $TSContext, mockResourceName);
    expect(answers).toMatchInlineSnapshot(`
      Object {
        "userpoolArn": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolArn",
          ],
        },
        "userpoolId": Object {
          "Fn::GetAtt": Array [
            "authmockResource",
            "Outputs.UserPoolId",
          ],
        },
      }
    `);
  });
});
