jest.mock('@aws-amplify/amplify-cli-core', () => {
  return {
    FeatureFlags: {
      getBoolean: jest.fn().mockReturnValue(true),
    },
  };
});

const { handleTriggers } = require('../../../../provider-utils/awscloudformation/utils/trigger-flow-auth-helper');

const defaults = {
  envVars: {},
  envInputs: {},
  resourceParams: {},
  updatedTrigger: {},
  addedTrigger: {},
};

const mockContext = (options = defaults) => {
  const contextObj = {
    amplify: {
      pathManager: {
        getBackendDirPath: () => '',
      },
      getTriggerEnvVariables: () => options.envVars,
      getTriggerEnvInputs: () => options.envVars,

      loadEnvResourceParameters: () => options.resourceParams,
      updateTrigger: () => options.updatedTrigger,
      addTrigger: () => options.addedTrigger,
      deleteDeselectedTriggers: () => null,
      saveEnvResourceParameters: () => null,
    },
  };
  return contextObj;
};

describe('When handling selected triggers...', () => {
  it('...it should return the triggers key/values unaltered on simple creation', async () => {
    const context = mockContext();
    const mockAnswers = {
      triggers: {
        PostConfirmation: ['add-to-group'],
        PostAuthentication: ['custom'],
      },
      authTriggerConnections: [
        {
          lambdaFunctionName: 'demoFnPostConfirmation',
          triggerType: 'PostConfirmation',
        },
        {
          lambdaFunctionName: 'demoFnPostAuthentication',
          triggerType: 'PostAuthentication',
        },
      ],
      resourceName: 'demoFn',
    };
    const { triggers, authTriggerConnections } = await handleTriggers(context, mockAnswers);
    expect(triggers).toEqual(mockAnswers.triggers);
    expect(authTriggerConnections).toEqual(mockAnswers.authTriggerConnections);
  });
});
