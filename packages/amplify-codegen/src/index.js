const path = require('path');
const glob = require('glob-all');
const appSyncCodeGen = require('aws-appsync-codegen');
const jetpack = require('fs-jetpack');
const Ora = require('ora');

const { join } = require('path');
const askAppSyncAPITarget = require('./walkthrough/questions/apiTarget');
const askCodeGenTargetLanguage = require('./walkthrough/questions/languageTarget');
const askCodeGenQueryFilePattern = require('./walkthrough/questions/queryFilePattern');
const askTargetFileName = require('./walkthrough/questions/generatedFileName');
const askShouldGenerateCode = require('./walkthrough/questions/generateCode');
const askShouldUpdateCode = require('./walkthrough/questions/updateCode');
const askShouldGenerateDocs = require('./walkthrough/questions/generateDocs');

const {
  getSchemaDownloadLocation,
  getIncludePattern,
} = require('./utils/');

const DEFAULT_EXCLUDE_PATTERNS = ['./amplify/**'];


const generateOps = require('amplify-graphql-docs-generator').default;

const loadConfig = require('./codegen-config');
const addWalkThrough = require('./walkthrough/add');
const configureProjectWalkThrough = require('./walkthrough/configure');
const constants = require('./constants');
const { downloadIntrospectionSchema, getFrontEndHandler, getAppSyncAPIDetails } = require('./utils');

async function downloadSchema(context, apiId, downloadLocation) {
  const downloadSpinner = new Ora(constants.INFO_MESSAGE_DOWNLOADING_SCHEMA);
  downloadSpinner.start();
  await downloadIntrospectionSchema(context, apiId, downloadLocation);
  downloadSpinner.succeed(constants.INFO_MESSAGE_DOWNLOAD_SUCCESS);
}

async function generate(context, forceDownloadSchema) {
  const config = loadConfig(context);
  const availableAppSyncApis = getAppSyncAPIDetails(context);
  const availableApiIds = availableAppSyncApis.map(api => api.id);
  const configuredProjects = config.getProjects();
  const projects = configuredProjects.filter(proj =>
    availableApiIds.includes(proj.amplifyExtension.graphQLApiId));

  if (!projects.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  }
  const frontend = getFrontEndHandler(context);
  projects.forEach(async (cfg) => {
    const excludes = cfg.excludes.map(pattern => `!${pattern}`);
    const includeFiles = cfg.includes;
    const queries = glob.sync([...includeFiles, ...excludes]);
    const schema = path.resolve(cfg.schema);
    const output = cfg.amplifyExtension.generatedFileName;
    const target = cfg.amplifyExtension.codeGenTarget;
    if (forceDownloadSchema || jetpack.exists(schema) !== 'file') {
      await downloadSchema(context, cfg.amplifyExtension.graphQLApiId, cfg.schema);
    }
    if (frontend !== 'android') {
      const codeGenSpinner = new Ora(constants.INFO_MESSAGE_CODEGEN_GENERATE_STARTED);
      codeGenSpinner.start();
      appSyncCodeGen.generate(queries, schema, output, '', target, 'gql', '', { addTypename: true });
      codeGenSpinner.succeed(`${constants.INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS} ${output}`);
    }
  });
}

function generateDocs(context, forceDownloadSchema) {
  const config = loadConfig(context);
  const availableAppSyncApis = getAppSyncAPIDetails(context);
  const availableApiIds = availableAppSyncApis.map(api => api.id);
  const configuredProjects = config.getProjects();
  const projects = configuredProjects.filter(proj =>
    availableApiIds.includes(proj.amplifyExtension.graphQLApiId));

  if (!projects.length) {
    context.print.info(constants.ERROR_CODEGEN_NO_API_CONFIGURED);
  }
  projects.forEach(async (cfg) => {
    const includeFiles = cfg.includes[0];
    const opsGenDirectory = cfg.docsFilePath || path.dirname(path.dirname(includeFiles));
    const schema = path.resolve(cfg.schema);

    if (forceDownloadSchema || jetpack.exists(schema) !== 'file') {
      await downloadSchema(context, cfg.amplifyExtension.graphQLApiId, cfg.schema);
    }

    const frontend = getFrontEndHandler(context);
    const language = frontend === 'javascript' ? 'javascript' : 'graphql';
    const opsGenSpinner = new Ora(constants.INFO_MESSAGE_OPS_GEN);
    opsGenSpinner.start();
    jetpack.dir(opsGenDirectory);
    generateOps(schema, opsGenDirectory, { separateFiles: true, language });
    opsGenSpinner.succeed(constants.INFO_MESSAGE_OPS_GEN_SUCCESS + path.relative(path.resolve('.'), opsGenDirectory));
  });
}

async function prePushAddGraphQLCodegenHook(context, resourceName) {
  if (await askShouldGenerateCode()) {
    let targetLanguage = '';
    let includePattern = '';
    let generatedFileName = '';

    const frontendHandler = getFrontEndHandler(context);
    const schemaLocation = getSchemaDownloadLocation(context, resourceName);
    const includePatternDefault = getIncludePattern(frontendHandler, schemaLocation);
    const includePathGlob = join(
      includePatternDefault.graphQLDirectory,
      '**',
      includePatternDefault.graphQLExtension,
    );
    includePattern = await askCodeGenQueryFilePattern([includePathGlob]);

    if (frontendHandler !== 'android') {
      targetLanguage = await askCodeGenTargetLanguage(context);
      generatedFileName = await askTargetFileName('API', targetLanguage);
    }

    const newProject = {
      projectName: resourceName,
      includes: includePattern,
      excludes: DEFAULT_EXCLUDE_PATTERNS,
      amplifyExtension: {
        codeGenTarget: targetLanguage,
        generatedFileName,
        docsFilePath: includePatternDefault.graphQLDirectory,
      },
    };

    const shouldGenerateDocs = await askShouldGenerateDocs();

    return {
      gqlConfig: newProject,
      shouldGenerateDocs,
    };
  }
}

async function prePushUpdateGraphQLCodegenHook(context, resourceName) {
  const config = loadConfig(context);
  const project = config.getProjects().find(projectItem =>
    projectItem.projectName === resourceName);
  if (project) {
    if (await askShouldUpdateCode()) {
      const shouldGenerateDocs = await askShouldGenerateDocs();
      return {
        gqlConfig: project,
        shouldGenerateDocs,
      };
    }
  }
}

async function postPushGraphQLCodegenHook(context, graphQLConfig) {
  if (!graphQLConfig) {
    return;
  }
  const config = loadConfig(context);
  const newAPIs = getAppSyncAPIDetails(context);

  const apiId = await askAppSyncAPITarget(context, newAPIs, null);
  const api = newAPIs.find(a => a.id === apiId);
  const schemaLocation = getSchemaDownloadLocation(context, graphQLConfig.gqlConfig.projectName);
  const schema = await downloadIntrospectionSchema(context, apiId, schemaLocation);

  const newProject = graphQLConfig.gqlConfig;
  newProject.amplifyExtension.graphQLApiId = api.id;
  newProject.endpoint = api.endpoint;
  newProject.schema = schema;

  config.addProject(newProject);

  config.save();

  if (graphQLConfig.shouldGenerateDocs) {
    generateDocs(context);
  }

  generate(context);
}

async function add(context) {
  const config = loadConfig(context);
  const answer = await addWalkThrough(context, config.getProjects());

  const { api } = answer;
  const spinner = new Ora(constants.INFO_MESSAGE_DOWNLOADING_SCHEMA);
  spinner.start();
  const schema = await downloadIntrospectionSchema(context, api.id, answer.schemaLocation);
  spinner.succeed(constants.INFO_MESSAGE_DOWNLOAD_SUCCESS);
  const newProject = {
    projectName: answer.api.name,
    includes: answer.includePattern,
    excludes: answer.excludePattern,
    schema,
    amplifyExtension: {
      graphQLApiId: answer.api.id,
      codeGenTarget: answer.target,
      generatedFileName: answer.generatedFileName,
      docsFilePath: answer.docsFilePath,
    },
    endpoint: answer.api.endpoint,
  };
  config.addProject(newProject);
  if (answer.shouldGenerateOps) {
    generateDocs(context);
  }
  if (answer.shouldGenerateCode) {
    generate(context);
  }
  config.save();
}

async function configure(context) {
  const config = loadConfig(context);
  if (!config.getProjects().length) {
    await add(context);
    return;
  }
  const project = await configureProjectWalkThrough(context, config.getProjects());
  config.addProject(project);
  config.save();
}

module.exports = {
  configure,
  generate,
  generateDocs,
  add,
  prePushAddGraphQLCodegenHook,
  prePushUpdateGraphQLCodegenHook,
  postPushGraphQLCodegenHook,
};
