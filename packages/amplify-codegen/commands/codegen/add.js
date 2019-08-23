const codeGen = require('../../src/index');
const path = require('path');
const fs = require('fs-extra');
const constants = require('../../src/constants');
const systemConfigManager = require('../../../amplify-provider-awscloudformation/lib/system-config-manager');
const askForFrontend = require('../../src/walkthrough/questions/selectFrontend');
const askForFramework = require('../../src/walkthrough/questions/selectFramework');
const askForProfile = require('../../src/walkthrough/questions/selectProfile');
const askForCreateProfile = require('../../src/walkthrough/questions/setupNewProfile');
const askApiId = require('../../src/walkthrough/questions/getApiId');
const featureName = 'add';
const frontends = ['android', 'ios', 'javascript'];
const frameworks = ['angular', 'ember', 'ionic', 'react', 'react-native', 'vue', 'none'];
const setupNewUser = require('../../../amplify-provider-awscloudformation/lib/setup-new-user');
const loadConfig = require('../../src/codegen-config');

module.exports = {
  name: featureName,
  run: async (context) => {
    try {
      const { options = {} } = context.parameters;
      const keys = Object.keys(options);

      // Determine if working in an amplify project
      try {
        context.amplify.getProjectMeta();
      } catch(e) {
        context.withoutInit = true;
        const config = loadConfig(context);
        if (config.getProjects().length) {
          throw new Error(constants.ERROR_CODEGEN_SUPPORT_MAX_ONE_API);
        }
      }

      if (keys.length && !keys.includes('apiId') && !context.withoutInit) {
        const paramMsg = keys.length > 1 ? 'Invalid parameters ' : 'Invalid parameter ';
        context.print.info(`${paramMsg} ${keys.join(', ')}`);
        context.print.info(constants.INFO_MESSAGE_ADD_ERROR);
        return;
      }
      let apiId = context.parameters.options.apiId || null;

      let schema = './schema.json';
      const schemaPath = path.join(process.cwd(), schema);
      if(!fs.existsSync(schemaPath)) {
        throw Error("Please download the introspection schema and place in " + schemaPath + " before adding codegen when not in an amplify project");
      }

      // Grab the frontend if it is provided
      const frontend = context.parameters.options.frontend;
      if (frontend) {
        // Make sure provided frontend prarameter is valid
        if (frontends.includes(frontend)) {
          context.frontend = frontend;
        } 
        else {
          throw Error('Invalid frontend provided');
        }
      } 
      else {
        // Only ask for frontend if not in an amplify project
        if (context.withoutInit) {
          context.frontend = await askForFrontend(frontends);
        }
      }
      // Grab the framework if it is provided
      const framework = context.parameters.options.framework;
      if (framework) {
        if (context.frontend === 'javascript' && frameworks.includes(framework)) {
          context.framework = framework;
        }
        else {
          throw Error('Invalid framework provided');
        }
      }
      else {
        // Only ask for framework if not in an amplify project
        if (context.withoutInit && context.frontend === 'javascript') {
          context.framework = await askForFramework(frameworks);
        }
      }

      await codeGen.add(context, apiId);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
