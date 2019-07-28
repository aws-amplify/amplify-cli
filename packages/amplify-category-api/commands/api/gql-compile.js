const subcommand = 'gql-compile';

module.exports = {
  name: subcommand,
  run: async (context) => {
    try {
      const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
      const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);

      const appSyncAPIs = Object.keys(amplifyMeta.api).reduce((acc, apiName) => {
        const api = amplifyMeta.api[apiName];
        if (api.service === 'AppSync') {
          acc.push({ ...api, name: apiName });
        }
        return acc;
      }, []);

      const appSyncApi = (appSyncAPIs && appSyncAPIs.length && appSyncAPIs.length > 0)
        ? appSyncAPIs[0]
        : undefined;

      let authConfig = {};

      if (appSyncApi) {
        if (appSyncApi.output.securityType) {
          authConfig = {
            defaultAuthentication: {
              authenticationType: appSyncApi.output.securityType,
            },
          };
        } else {
          ({ authConfig } = appSyncApi.output);
        }
      }

      await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { noConfig: true, forceCompile: true, authConfig });
    } catch (err) {
      context.print.error(err.toString());
    }
  },
};
