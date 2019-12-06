module.exports = async (context, apiDetails) => {
  const fs = context.filesystem;

  const appsyncMetadata = {
    service: 'AppSync',
    output: {
      authConfig: apiDetails.authConfig,
      GraphQLAPIIdOutput: apiDetails.id,
      GraphQLAPIEndpointOutput: apiDetails.endpoint,
      name: apiDetails.name,
    },
    lastPushTimeStamp: new Date(),
  };
  if (apiDetails.region) {
    appsyncMetadata.output.region = apiDetails.region;
  }
  if (apiDetails.apiKeys && apiDetails.apiKeys.length) {
    // eslint-disable-next-line prefer-destructuring
    appsyncMetadata.output.GraphQLAPIKeyOutput = apiDetails.apiKeys[0].id;
  }

  const { amplifyMeta } = context.amplify.getProjectDetails();

  if (!amplifyMeta.api) {
    amplifyMeta.api = {};
  }

  amplifyMeta.api[apiDetails.name] = appsyncMetadata;

  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  fs.write(amplifyMetaFilePath, JSON.stringify(amplifyMeta, null, 4));

  const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurrentAmplifyMetaFilePath();
  const currentAmplifyMeta = context.amplify.readJsonFile(currentAmplifyMetaFilePath);
  if (!currentAmplifyMeta.api) {
    currentAmplifyMeta.api = {};
  }
  currentAmplifyMeta.api[apiDetails.name] = appsyncMetadata;
  fs.write(currentAmplifyMetaFilePath, JSON.stringify(currentAmplifyMeta, null, 4));

  await context.amplify.onCategoryOutputsChange(context);
  context.print.success(`Successfully added API ${apiDetails.name} to your Amplify project`);
};
