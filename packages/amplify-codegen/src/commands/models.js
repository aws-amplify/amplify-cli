const path = require('path');
const fs = require('fs-extra');
const { parse } = require('graphql');
const { FeatureFlags, pathManager } = require('amplify-cli-core');
const gqlCodeGen = require('@graphql-codegen/core');
const { getModelgenPackage } = require('../utils/getModelgenPackage');

const platformToLanguageMap = {
  android: 'java',
  ios: 'swift',
  flutter: 'dart',
  javascript: 'javascript',
};

async function generateModels(context) {
  // steps:
  // 1. Load the schema and validate using transformer
  // 2. get all the directives supported by transformer
  // 3. Generate code
  let projectRoot;
  try {
    context.amplify.getProjectMeta();
    projectRoot = context.amplify.getEnvInfo().projectPath;
  } catch (e) {
    projectRoot = process.cwd();
  }

  const allApiResources = await context.amplify.getResourceStatus('api');
  const apiResource = allApiResources.allResources.find(
    resource => resource.service === 'AppSync' && resource.providerPlugin === 'awscloudformation',
  );

  if (!apiResource) {
    context.print.info('No AppSync API configured. Please add an API');
    return;
  }

  await validateSchema(context);
  const backendPath = await context.amplify.pathManager.getBackendDirPath();
  const apiResourcePath = path.join(backendPath, 'api', apiResource.resourceName);

  const directiveDefinitions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getTransformerDirectives', {
    resourceDir: apiResourcePath,
  });

  const schemaContent = loadSchema(apiResourcePath);
  const outputPath = path.join(projectRoot, getModelOutputPath(context));
  const schema = parse(schemaContent);
  const projectConfig = context.amplify.getProjectConfig();

  const modelgenPackageMigrationflag = 'codegen.useAppSyncModelgenPlugin';

  const appSyncDataStoreCodeGen = getModelgenPackage(FeatureFlags.getBoolean(modelgenPackageMigrationflag));

  const appsyncLocalConfig = await appSyncDataStoreCodeGen.preset.buildGeneratesSection({
    baseOutputDir: outputPath,
    schema,
    config: {
      target: platformToLanguageMap[projectConfig.frontend] || projectConfig.frontend,
      directives: directiveDefinitions,
    },
  });

  const codeGenPromises = appsyncLocalConfig.map(cfg => {
    return gqlCodeGen.codegen({
      ...cfg,
      plugins: [
        {
          appSyncLocalCodeGen: {},
        },
      ],
      pluginMap: {
        appSyncLocalCodeGen: appSyncDataStoreCodeGen,
      },
    });
  });

  const generatedCode = await Promise.all(codeGenPromises);

  appsyncLocalConfig.forEach((cfg, idx) => {
    const outPutPath = cfg.filename;
    fs.ensureFileSync(outPutPath);
    fs.writeFileSync(outPutPath, generatedCode[idx]);
  });

  generateEslintIgnore(context);

  context.print.info(`Successfully generated models. Generated models can be found in ${outputPath}`);
}

async function validateSchema(context) {
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    noConfig: true,
    forceCompile: true,
    dryRun: true,
    disableResolverOverrides: true,
  });
}

function loadSchema(apiResourcePath) {
  const schemaFilePath = path.join(apiResourcePath, 'schema.graphql');
  const schemaDirectory = path.join(apiResourcePath, 'schema');
  if (fs.pathExistsSync(schemaFilePath)) {
    return fs.readFileSync(schemaFilePath, 'utf8');
  }
  if (fs.pathExistsSync(schemaDirectory) && fs.lstatSync(schemaDirectory).isDirectory()) {
    return fs
      .readdirSync(schemaDirectory)
      .map(file => path.join(schemaDirectory, file))
      .filter(file => file.endsWith('.graphql') && fs.lstatSync(file).isFile())
      .map(file => fs.readFileSync(file, 'utf8'))
      .join('\n');
  }

  throw new Error('Could not load the schema');
}

function getModelOutputPath(context) {
  const projectConfig = context.amplify.getProjectConfig();
  switch (projectConfig.frontend) {
    case 'javascript':
      return projectConfig.javascript && projectConfig.javascript.config && projectConfig.javascript.config.SourceDir
        ? path.normalize(projectConfig.javascript.config.SourceDir)
        : 'src';
    case 'android':
      return projectConfig.android && projectConfig.android.config && projectConfig.android.config.ResDir
        ? path.normalize(path.join(projectConfig.android.config.ResDir, '..', 'java'))
        : path.join('app', 'src', 'main', 'java');
    case 'ios':
      return 'amplify/generated/models';
    case 'flutter':
      return 'lib/models';
    default:
      return '.';
  }
}

function generateEslintIgnore(context) {
  const projectConfig = context.amplify.getProjectConfig();

  if (projectConfig.frontend !== 'javascript') {
    return;
  }

  const projectPath = pathManager.findProjectRoot();

  if (!projectPath) {
    return;
  }

  const eslintIgnorePath = path.join(projectPath, '.eslintignore');
  const modelFolder = path.join(getModelOutputPath(context), 'models');

  if (!fs.existsSync(eslintIgnorePath)) {
    fs.writeFileSync(eslintIgnorePath, modelFolder);
    return;
  }

  const eslintContents = fs.readFileSync(eslintIgnorePath);

  if (!eslintContents.includes(modelFolder)) {
    fs.appendFileSync(eslintIgnorePath, `\n${modelFolder}\n`);
  }
}

module.exports = generateModels;
