const Ora = require('ora');
const loadConfig = require('../codegen-config');
const constants = require('../constants');
const generateStatements = require('./statements');
const generateTypes = require('./types');
const { AmplifyCodeGenNoAppSyncAPIAvailableError: NoAppSyncAPIAvailableError, AmplifyCodeGenAPINotFoundError } = require('../errors');
const {
  downloadIntrospectionSchemaWithProgress,
  getAppSyncAPIDetails,
  getAppSyncAPIInfo,
  getProjectAwsRegion,
  updateAmplifyMeta,
  getSDLSchemaLocation,
  getFrontEndHandler,
} = require('../utils');
const addWalkThrough = require('../walkthrough/add');
const changeAppSyncRegion = require('../walkthrough/changeAppSyncRegions');
const path = require('path');
const fs = require('fs-extra');
const askForFrontend = require('../walkthrough/questions/selectFrontend');
const askForFramework = require('../walkthrough/questions/selectFramework');

const frontends = ['android', 'ios', 'javascript', 'flutter'];
const frameworks = ['angular', 'ember', 'ionic', 'react', 'react-native', 'vue', 'none'];

async function add(context, apiId = null) {
  let withoutInit = false;
  // Determine if working in an amplify project
  try {
    context.amplify.getProjectMeta();
  } catch (e) {
    withoutInit = true;
    const config = loadConfig(context, withoutInit);
    if (config.getProjects().length) {
      throw new Error(constants.ERROR_CODEGEN_SUPPORT_MAX_ONE_API);
    }
  }

  const schemaPath = ['schema.graphql', 'schema.json'].map(p => path.join(process.cwd(), p)).find(p => fs.existsSync(p));
  if (withoutInit && !schemaPath) {
    throw Error(
      `Please download schema.graphql or schema.json and place in ${process.cwd()} before adding codegen when not in an amplify project`,
    );
  }
  // Grab the frontend
  let frontend;
  if (withoutInit) {
    ({ frontend } = context.parameters.options);
    if (frontend) {
      // Make sure provided frontend prarameter is valid
      if (!frontends.includes(frontend)) {
        throw Error('Invalid frontend provided');
      }
    } else {
      frontend = await askForFrontend(frontends);
    }
  }

  // Grab the framework
  let framework;
  if (withoutInit) {
    ({ framework } = context.parameters.options);
    if (framework) {
      if (frontend !== 'javascript' || !frameworks.includes(framework)) {
        throw Error('Invalid framework provided');
      }
    } else if (frontend === 'javascript') {
      framework = await askForFramework(frameworks);
    }
  }

  let region = 'us-east-1';
  if (!withoutInit) {
    region = getProjectAwsRegion(context);
  }
  const config = loadConfig(context, withoutInit);
  if (config.getProjects().length) {
    throw new Error(constants.ERROR_CODEGEN_SUPPORT_MAX_ONE_API);
  }
  let apiDetails;
  if (!withoutInit) {
    if (!apiId) {
      const availableAppSyncApis = getAppSyncAPIDetails(context); // published and un-published
      if (availableAppSyncApis.length === 0) {
        throw new NoAppSyncAPIAvailableError(constants.ERROR_CODEGEN_NO_API_AVAILABLE);
      }
      [apiDetails] = availableAppSyncApis;
      apiDetails.isLocal = true;
    } else {
      let shouldRetry = true;
      while (shouldRetry) {
        const apiDetailSpinner = new Ora();
        try {
          apiDetailSpinner.start('Getting API details');
          apiDetails = await getAppSyncAPIInfo(context, apiId, region);
          apiDetailSpinner.succeed();
          await updateAmplifyMeta(context, apiDetails);
          break;
        } catch (e) {
          apiDetailSpinner.fail();
          if (e instanceof AmplifyCodeGenAPINotFoundError) {
            context.print.info(`AppSync API was not found in region ${region}`);
            ({ shouldRetry, region } = await changeAppSyncRegion(context, region));
          } else {
            throw e;
          }
        }
      }
    }
  }

  if (!withoutInit && !apiDetails) {
    return;
  }
  const answer = await addWalkThrough(context, undefined, withoutInit, frontend, framework);

  let schema;
  if (!withoutInit) {
    if (!apiDetails.isLocal) {
      schema = await downloadIntrospectionSchemaWithProgress(context, apiDetails.id, answer.schemaLocation, region);
    } else if (getFrontEndHandler(context) === 'android') {
      schema = answer.schemaLocation;
    } else {
      schema = getSDLSchemaLocation(apiDetails.name);
    }
  } else {
    schema = schemaPath;
  }

  const newProject = {
    projectName: withoutInit ? 'Codegen Project' : apiDetails.name,
    includes: answer.includePattern,
    excludes: answer.excludePattern,
    schema,
    amplifyExtension: {
      codeGenTarget: answer.target || '',
      generatedFileName: answer.generatedFileName || '',
      docsFilePath: answer.docsFilePath,
      region,
      apiId,
      ...(withoutInit ? { frontend } : {}),
      ...(withoutInit && frontend === 'javascript' ? { framework } : {}),
    },
  };

  if (answer.maxDepth) {
    newProject.amplifyExtension.maxDepth = answer.maxDepth;
  }
  config.addProject(newProject);
  if (answer.shouldGenerateDocs) {
    await generateStatements(context, false, undefined, withoutInit, frontend);
  }
  if (answer.shouldGenerateCode) {
    await generateTypes(context, false, withoutInit, frontend);
  }
  config.save();
}

module.exports = add;
