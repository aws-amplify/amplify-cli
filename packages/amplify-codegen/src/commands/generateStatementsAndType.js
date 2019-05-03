const { join } = require('path');
const {
  AmplifyCodeGenNoAppSyncAPIAvailableError: NoAppSyncAPIAvailableError,
} = require('../errors');
const generateTypes = require('./types');
const generateStatements = require('./statements');
const loadConfig = require('../codegen-config');
const constants = require('../constants');
const { downloadIntrospectionSchemaWithProgress, isAppSyncApiPendingPush, getAppSyncAPIDetails } = require('../utils');

async function generateStatementsAndTypes(context, forceDownloadSchema, maxDepth) {
  const config = loadConfig(context);
  const projects = config.getProjects();

  const { projectPath } = context.amplify.getEnvInfo();
  const apis = getAppSyncAPIDetails(context);
  if (!projects.length || !apis.length) {
    throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  }

  if (forceDownloadSchema) {
    const downloadPromises = projects.map(async cfg =>
      downloadIntrospectionSchemaWithProgress(
        context,
        apis[0].id,
        join(projectPath, cfg.schema),
        cfg.amplifyExtension.region,
      ),
    );
    await Promise.all(downloadPromises);
  }
  await generateStatements(context, false, maxDepth);
  await generateTypes(context, false);
  const pendingPush = await isAppSyncApiPendingPush(context);
  if (pendingPush) {
    context.print.info(constants.MSG_CODEGEN_PENDING_API_PUSH);
  }
}

module.exports = generateStatementsAndTypes;
