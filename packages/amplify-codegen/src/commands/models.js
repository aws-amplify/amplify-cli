const path = require('path');
const { parse } = require('graphql');
const { readFileSync, writeFileSync, ensureFileSync, pathExistsSync, lstatSync, readdirSync } = require('fs-extra');
const gqlCodeGen = require('@graphql-codegen/core');

const appSyncDataStoreCodeGen = require('amplify-codegen-appsync-model-plugin');

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
    resource => resource.service === 'AppSync' && resource.providerPlugin === 'awscloudformation'
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

  const appsyncLocalConfig = await appSyncDataStoreCodeGen.preset.buildGeneratesSection({
    baseOutputDir: outputPath,
    schema,
    config: {
      target: projectConfig.frontend,
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
    ensureFileSync(outPutPath);
    writeFileSync(outPutPath, generatedCode[idx]);
  });
  context.print.info(`Successfully generated models. Generated models can be found ${outputPath}`);
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
  if (pathExistsSync(schemaFilePath)) {
    return readFileSync(schemaFilePath, 'utf8');
  }
  if (pathExistsSync(schemaDirectory) && lstatSync(schemaDirectory).isDirectory()) {
    return readdirSync(schemaDirectory)
      .map(file => path.join(schemaDirectory, file))
      .filter(file => file.endsWith('.graphql') && lstatSync(file).isFile())
      .map(file => readFileSync(file, 'utf8'))
      .join('\n');
  }

  throw new Error('Could not load the schema');
}

function getModelOutputPath(context) {
  const projectConfig = context.amplify.getProjectConfig();
  switch (projectConfig.frontend) {
    case 'javascript':
      return 'src';
    case 'android':
      return 'app/src/main/java/';
    case 'ios':
      return 'amplify/generated/models';
    default:
      return '.';
  }
}
module.exports = generateModels;
