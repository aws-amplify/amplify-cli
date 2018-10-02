
module.exports = (context, apiDetails) => {
  const fs = context.filesystem;

  const appsyncMetadata = {
    service: 'AppSync',
    output: {
      securityType: apiDetails.securityType,
      GraphQLAPIIdOutput: apiDetails.id,
      GraphQLAPIEndpointOutput: apiDetails.endpoint,
    },
    lastPushTimeStamp: new Date(),
  };
  if (apiDetails.apiKey) {
    appsyncMetadata.output.GraphQLAPIKeyOutput = apiDetails.apiKey;
  }

  const { amplifyMeta } = context.amplify.getProjectDetails();

  if (!amplifyMeta.api) {
    amplifyMeta.api = {};
  }

  amplifyMeta.api[apiDetails.name] = appsyncMetadata;


  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  fs.write(amplifyMetaFilePath, amplifyMeta);

  const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
  const currentAmplifyMeta = JSON.parse(fs.read(currentAmplifyMetaFilePath));
  if (!currentAmplifyMeta.api) {
    currentAmplifyMeta.api = {};
  }
  currentAmplifyMeta.api[apiDetails.name] = appsyncMetadata;
  fs.write(currentAmplifyMetaFilePath, currentAmplifyMeta);

  context.amplify.onCategoryOutputsChange(context);
  context.print.success(`Successfully added API ${apiDetails.name} to your Amplify project`);
};
