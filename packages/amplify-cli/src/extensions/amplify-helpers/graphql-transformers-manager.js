const fs = require('fs');
const path = require('path');
const { Transformer, TRANSFORM_CONFIG_FILE_NAME } = require('graphql-transformer-core');
const globalPrefix = require('../../lib/global-prefix');
const providerName = 'awscloudformation'

const relativeAWSCloudFormationComponents = [
  __dirname,
  "..",
  "..",
  "..",
  "node_modules",
  "amplify-provider-awscloudformation",
  "node_modules"
];

// corresponds to ./amplify-provider-awscloudformation/lib/transform-graphql-schema.js transformerList
// used merely to list all built in tranformers in enabled transformers list
const builtInTransformerNames = [
  'graphql-auth-transformer', 
  'graphql-connection-transformer',
  'graphql-dynamodb-transformer',
  'graphql-elasticsearch-transformer',
  'graphql-versioned-transformer'
];

const builtInTransformers = builtInTransformerNames.map(name => ({
  name,
  type: 'built-in',
  enabled: true,
  path: path.normalize(path.join(...relativeAWSCloudFormationComponents, name))
}));

// const backEndDir = context.amplify.pathManager.getBackendDirPath();
// const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
// /Users/hurden/Developer/lean/code/ballcaststats/amplify/backend/api/ballcaststats/transform.conf.json

async function transformConfPath(context, category){
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
      return null
    }
    const { category, resourceName } = resource;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    return path.normalize(path.join(backEndDir, category, resourceName, TRANSFORM_CONFIG_FILE_NAME));
  } else {
    return null
  }
}

async function loadCustomTransformersConfig(context, category){
  const transformerConfigPath = await transformConfPath(context, category)
  if(!transformerConfigPath){
    return null
  }

  try {
    const transformerConfig = JSON.parse(fs.readFileSync(transformerConfigPath));
    return transformerConfig
  } catch(error){
    return null
  }
}

async function loadCustomTransformers(context, category){
  const customTransformersConfig = await loadCustomTransformersConfig(context, category);
  return customTransformersConfig && customTransformersConfig.transformers 
    ? customTransformersConfig.transformers || []
    : [];
}

async function saveCustomTransformers(context, category, transformers){
  const partialTransformers = transformers.map(({name, enabled, path, modulePath}) => ({ name, enabled, path, modulePath }));
  const customTransformersConfig = await loadCustomTransformersConfig(context, category);
  if(customTransformersConfig){
    customTransformersConfig.transformers = partialTransformers
  }

  const toSave = customTransformersConfig ? customTransformersConfig : { transformers: partialTransformers }
  const transformerConfigPath = await transformConfPath(context, category)
  try {
    fs.writeFileSync(transformerConfigPath, JSON.stringify(toSave, null, 2))
    return transformerConfigPath
  } catch(error){
    context.print.warning('Failed to save transformer config')
    return null
  }
}

function isValidTransformerModule(modulePath){
  try {
    let transformer = require(modulePath);
    // FIXME: this is hacky, as I am not able to use instanceOf with tsc's emitted es5 Transformer 
    return transformer.default.__proto__.constructor === Transformer.constructor
  } catch {
    return false
  }
}

function packageMetadata(packagePath){
  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json')));
  } catch (error) {
    return null
  }

  const entry = meta.main
  if(!entry){
    return null
  }

  return {
    name: meta.name || "name unavailable",
    description: meta.description || "",
    author: meta.author || "",
    version: meta.version || "",
    modulePath: path.join(packagePath, entry),
    path: packagePath
  }
}

async function loadEnabledTransformers(context, category){
  const custom = (await loadCustomTransformers(context, category)).map(transformer => ({
    ...transformer,
    type: 'custom'
  }));

  return [
    ...builtInTransformers,
    ...custom
  ]
  .map(transformer => ({
    transformer,
    packageMetadata: transformer.path ? packageMetadata(transformer.path) : null
  }))
  .filter(({packageMetadata}) => {
    // warn unable to read metadata for package
    return packageMetadata
  })
  .map(({transformer, packageMetadata}) => ({
    ...packageMetadata,
    ...transformer
  }))
}

/** expects node_modules directory */
function scan(directory){
  return fs.readdirSync(directory)
    .filter(subdir => subdir.match(/graphql-([\w\d_\-]+)-transformer/))
    .map(subdir => {
      const packagePath = path.join(directory, subdir);
      const meta = packageMetadata(packagePath);
      return meta && isValidTransformerModule(meta.modulePath) ? meta : null
    })
    .filter(transformerInfo => transformerInfo)
    .map(transformerInfo => ({
      ...transformerInfo,
      type: 'custom'
    }))
}

async function scanNodeModules(context, category){
  const existingTransformer = await loadEnabledTransformers(context, category);
  // scan amplify-provider-awscloudformation 
  const amplifyProviderCloudFormationPath = path.normalize(path.join(...relativeAWSCloudFormationComponents));
  const amplifyCLIPackagesPath = path.normalize(path.join(__dirname, "..", "..", "..", ".."));
  const projectNodeModulesDirPath = path.join(context.amplify.pathManager.searchProjectRootPath(), 'node_modules');
  const globalNodeModulesDirPath = globalPrefix.getGlobalNodeModuleDirPath();
  return [amplifyProviderCloudFormationPath, amplifyCLIPackagesPath, projectNodeModulesDirPath, globalNodeModulesDirPath]
    .map(directory => scan(directory))
    .reduce((target, transformers) => [...target, ...transformers], [])
    .filter(transformer => 
      !existingTransformer.find(existing => 
        // 1. builtIn transformers are matched based on name
        // 2. custom transformers are matched on names and versions as we can switch between custom transformers with different versions 
        builtInTransformerNames.includes(existing.name) 
          ? existing.name == transformer.name
          : existing.name == transformer.name && existing.version == transformer.version
    ))
}

module.exports = {
  builtInTransformerNames,
  builtInTransformers,
  loadEnabledTransformers,
  scanNodeModules,
  saveCustomTransformers
}