const codeGen = require('../../src/index');
const constants = require('../../src/constants');
const systemConfigManager = require('../../../amplify-provider-awscloudformation/lib/system-config-manager');
const askForFrontend = require('../../src/walkthrough/questions/selectFrontend');
const askForFramework = require('../../src/walkthrough/questions/selectFramework');
const askForProfile = require('../../src/walkthrough/questions/selectProfile');
const askApiId = require('../../src/walkthrough/questions/getApiId');
const featureName = 'add';
const frontends = ['android', 'ios', 'javascript'];
const frameworks = ['angular', 'ember', 'ionic', 'react', 'react-native', 'vue', 'none'];

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
      }

      if (keys.length && !keys.includes('apiId') && !context.withoutInit) {
        const paramMsg = keys.length > 1 ? 'Invalid parameters ' : 'Invalid parameter ';
        context.print.info(`${paramMsg} ${keys.join(', ')}`);
        context.print.info(constants.INFO_MESSAGE_ADD_ERROR);
        return;
      }
      let apiId = context.parameters.options.apiId || null;
      if (!apiId && context.withoutInit) {
        apiId = await askApiId();
      }
      
      // Grab the profile if its provided
      const profile = context.parameters.options.profile;
      let namedProfiles = systemConfigManager.getNamedProfiles();
      if (profile) {
        if (namedProfiles[profile]){
          context.profile = profile;
          context.region = systemConfigManager.getProfileRegion(profile);
        } 
        else {
          throw Error('Invalid profile name provided. Use an existing AWS profile');
        }
      } else {
        // Only ask for profile if not in an amplify project
        if (context.withoutInit) {
          context.profile = await askForProfile(Object.keys(namedProfiles));
          context.region = systemConfigManager.getProfileRegion(context.profile);
        }
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
