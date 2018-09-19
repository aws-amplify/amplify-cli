const Ora = require('ora');
const loadConfig = require('../codegen-config');
const constants = require('../constants');
const generateStatements = require('./statements');
const generateTypes = require('./types');
const {
  AmplifyCodeGenNoAppSyncAPIAvailableError: NoAppSyncAPIAvailableError,
  AmplifyCodeGenAPIPendingPush,
} = require('../errors');
const {
  downloadIntrospectionSchemaWithProgress,
  getAppSyncAPIDetails,
  getAppSyncAPIInfo,
} = require('../utils');
const addWalkThrough = require('../walkthrough/add');

async function add(context, apiId = null) {
  const config = loadConfig(context);
  if (config.getProjects().length) {
    throw new Error(constants.ERROR_CODEGEN_SUPPORT_MAX_ONE_API);
  }
  let apiDetails;
  if (!apiId) {
    const availableAppSyncApis = getAppSyncAPIDetails(context); // published and un-published
    if (availableAppSyncApis.length === 0) {
      throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_AVAILABLE);
    }
    const pendingPushAPIs = availableAppSyncApis.filter(a => !a.id);
    if (pendingPushAPIs.length) {
      throw new AmplifyCodeGenAPIPendingPush(constants.ERROR_CODEGEN_PENDING_API_PUSH);
    }
    [apiDetails] = availableAppSyncApis;
  } else {
    const apiDetailSpinner = new Ora();
    apiDetailSpinner.start('getting API details');
    apiDetails = await getAppSyncAPIInfo(context, apiId);
    apiDetailSpinner.stop();
  }
  const answer = await addWalkThrough(context);

  const schema = await downloadIntrospectionSchemaWithProgress(
    context,
    apiDetails.id,
    answer.schemaLocation,
  );

  const newProject = {
    projectName: apiDetails.name,
    includes: answer.includePattern,
    excludes: answer.excludePattern,
    schema,
    amplifyExtension: {
      graphQLApiId: apiDetails.id,
      codeGenTarget: answer.target || '',
      generatedFileName: answer.generatedFileName || '',
      docsFilePath: answer.docsFilePath,
    },
    endpoint: apiDetails.endpoint,
  };

  config.addProject(newProject);
  if (answer.shouldGenerateDocs) {
    await generateStatements(context, false);
  }
  if (answer.shouldGenerateCode) {
    await generateTypes(context, false);
  }
  config.save();
}

module.exports = add;
