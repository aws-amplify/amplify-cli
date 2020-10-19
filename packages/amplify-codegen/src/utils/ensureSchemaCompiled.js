const fs = require('fs-extra');
const existsAppSyncAPIResourse = require('./existsAppSyncAPIResource');

async function ensureSchemaCompiled(context, schemaPath) {
    if (!schemaPath.endsWith('.json') && existsAppSyncAPIResourse(context) && fs.existsSync(schemaPath)) {
        await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
          forceCompile: true,
        });
      }
}

module.exports = ensureSchemaCompiled;