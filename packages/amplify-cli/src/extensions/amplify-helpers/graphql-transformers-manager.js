const fs = require('fs');
const path = require('path');
const { Transformer, TRANSFORM_CONFIG_FILE_NAME } = require('graphql-transformer-core');
const globalPrefix = require('../../lib/global-prefix');

const providerName = 'awscloudformation';

const relativeAWSCloudFormationComponents = [
  __dirname,
  '..',
  '..',
  '..',
  'node_modules',
  'amplify-provider-awscloudformation',
  'node_modules',
];

// corresponds to
// ./amplify-provider-awscloudformation/lib/transform-graphql-schema.js transformerList
// used merely to list all built in tranformers in enabled transformers list
const builtInTransformerNames = [
  'graphql-auth-transformer',
  'graphql-connection-transformer',
  'graphql-dynamodb-transformer',
  'graphql-elasticsearch-transformer',
  'graphql-versioned-transformer',
];

const builtInTransformers = builtInTransformerNames.map(name => ({
  name,
  type: 'built-in',
  enabled: true,
  path: path.normalize(path.join(...relativeAWSCloudFormationComponents, name)),
}));

async function transformConfPath(context, category) {
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    allResources,
  } = await context.amplify.getResourceStatus(category);
  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  resources = resources.concat(allResources).filter(resource => resource.service === 'AppSync');
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    if (resource.providerPlugin !== providerName) {
      return null;
    }
    const { category, resourceName } = resource; // eslint-disable-line no-shadow
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const targetPath = path.join(backEndDir, category, resourceName, TRANSFORM_CONFIG_FILE_NAME);
    return path.normalize(targetPath);
  }
  return null;
}

async function loadCustomTransformersConfig(context, category) {
  const transformerConfigPath = await transformConfPath(context, category);
  if (!transformerConfigPath) {
    context.print.warning('Could not determine transformer config path. Have you enabled AppSync GraphQL API?');
    return null;
  }

  try {
    const transformerConfig = JSON.parse(fs.readFileSync(transformerConfigPath));
    return transformerConfig;
  } catch (error) {
    context.print.error('Tranformer config parsing failure');
    context.print.error(error);
    return null;
  }
}

async function loadCustomTransformers(context, category) {
  const customTransformersConfig = await loadCustomTransformersConfig(context, category);
  return customTransformersConfig && customTransformersConfig.transformers
    ? customTransformersConfig.transformers || []
    : [];
}

async function saveCustomTransformers(context, category, transformers) {
  const partialTransformers = transformers.map(({
    name, enabled, path, modulePath, // eslint-disable-line no-shadow
  }) => ({
    name, enabled, path, modulePath,
  }));
  const customTransformersConfig = await loadCustomTransformersConfig(context, category);
  if (customTransformersConfig) {
    customTransformersConfig.transformers = partialTransformers;
  }

  const toSave = customTransformersConfig || { transformers: partialTransformers };
  const transformerConfigPath = await transformConfPath(context, category);
  try {
    fs.writeFileSync(transformerConfigPath, JSON.stringify(toSave, null, 2));
    return transformerConfigPath;
  } catch (error) {
    context.print.error('Failed to save transformer config');
    return null;
  }
}

function isValidTransformerModule(context, modulePath) {
  try {
    const transformer = require(modulePath);
    // FIXME: this is hacky, as I am not able to use instanceOf with tsc's emitted es5 Transformer
    // eslint-disable-next-line no-proto
    return transformer.default.__proto__.constructor === Transformer.constructor;
  } catch (error) {
    context.print.warning(`Module ${modulePath} does not export a valid Transformer subclass`);
    return false;
  }
}

function packageMetadata(context, packagePath) {
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json')));
  } catch (error) {
    context.print.warning(`Unable to parse package.json at ${packagePath}`);
    return null;
  }

  const entry = meta.main;
  if (!entry) {
    context.print.warning(`package.json at ${packagePath} does not define an entry module`);
    return null;
  }

  return {
    name: meta.name || 'name unavailable',
    description: meta.description || '',
    author: meta.author || '',
    version: meta.version || '',
    modulePath: path.join(packagePath, entry),
    path: packagePath,
  };
}

async function loadEnabledTransformers(context, category) {
  const custom = (await loadCustomTransformers(context, category)).map(transformer => ({
    ...transformer,
    type: 'custom',
  }));

  return [
    ...builtInTransformers,
    ...custom,
  ]
    .map(transformer => ({
      transformer,
      packageMetadata: transformer.path ? packageMetadata(context, transformer.path) : null,
    }))
    // eslint-disable-next-line no-shadow
    .filter(({ packageMetadata }) => packageMetadata)
    // eslint-disable-next-line no-shadow
    .map(({ transformer, packageMetadata }) => ({
      ...packageMetadata,
      ...transformer,
    }));
}

/** expects node_modules directory */
function scan(context, directory) {
  return fs.readdirSync(directory)
    .filter(subdir => subdir.match(/graphql-([\w\d_-]+)-transformer/))
    .map((subdir) => {
      const packagePath = path.join(directory, subdir);
      const meta = packageMetadata(context, packagePath);
      return meta && isValidTransformerModule(context, meta.modulePath) ? meta : null;
    })
    .filter(transformerInfo => transformerInfo)
    .map(transformerInfo => ({
      ...transformerInfo,
      type: 'custom',
    }));
}

async function scanNodeModules(context, category) {
  const existingTransformer = await loadEnabledTransformers(context, category);
  // scan amplify-provider-awscloudformation
  const providerPath = path.normalize(path.join(...relativeAWSCloudFormationComponents));
  const amplifyCLIPackagesPath = path.normalize(path.join(__dirname, '..', '..', '..', '..'));
  const projectNodeModulesDirPath = path.join(
    context.amplify.pathManager.searchProjectRootPath(),
    'node_modules',
  );
  const globalNodeModulesDirPath = globalPrefix.getGlobalNodeModuleDirPath();
  return [
    providerPath,
    amplifyCLIPackagesPath,
    projectNodeModulesDirPath,
    globalNodeModulesDirPath,
  ]
    .map(directory => scan(context, directory))
    .reduce((target, transformers) => [...target, ...transformers], [])
    .filter(transformer =>
      !existingTransformer.find(existing =>
        // 1. builtIn transformers are matched based on name
        // 2. custom transformers are matched on names and versions
        //    as we can switch between custom transformers with different versions
        (builtInTransformerNames.includes(existing.name)
          ? existing.name === transformer.name
          : existing.name === transformer.name && existing.version === transformer.version)));
}

module.exports = {
  builtInTransformerNames,
  builtInTransformers,
  loadEnabledTransformers,
  loadCustomTransformers,
  scanNodeModules,
  saveCustomTransformers,
};
