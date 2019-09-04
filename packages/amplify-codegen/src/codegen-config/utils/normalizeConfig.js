const upath = require('upath');

function normalizeConfig(config) {
  const normalizedConfig = { ...config };
  if (config.schemaPath) {
    normalizedConfig.schemaPath = upath.toUnix(config.schemaPath);
  }
  normalizedConfig.includes = config.includes.map(p => upath.toUnix(p));
  normalizedConfig.excludes = config.excludes.map(p => upath.toUnix(p));

  if (config.extensions.amplify) {
    normalizedConfig.extensions = { amplify: {} };
    const amplifyExtension = { ...config.extensions.amplify };
    amplifyExtension.generatedFileName = amplifyExtension.generatedFileName
      ? upath.toUnix(amplifyExtension.generatedFileName)
      : amplifyExtension.generatedFileName;
    amplifyExtension.docsFilePath = amplifyExtension.docsFilePath
      ? upath.toUnix(amplifyExtension.docsFilePath)
      : amplifyExtension.docsFilePath;
    normalizedConfig.extensions.amplify = amplifyExtension;
  }
  return normalizedConfig;
}
module.exports = { normalizeConfig };
