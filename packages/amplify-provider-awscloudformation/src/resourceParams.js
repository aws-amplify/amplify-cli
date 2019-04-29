const path = require('path');
const fs = require('fs');

function getResourceDirPath(context, category, resource) {
  const { projectPath } = context.migrationInfo || context.amplify.getEnvInfo();
  const backendDirPath = context.amplify.pathManager.getBackendDirPath(projectPath);
  return path.join(backendDirPath, category, resource);
}

function saveResourceParameters(
  context,
  category,
  resource,
  parameters,
  envSpecificParamsName = [],
) {
  const resourceDirPath = getResourceDirPath(context, category, resource);
  const parametersFilePath = path.join(resourceDirPath, 'parameters.json');
  const envSpecificParams = {};
  const sharedParams = { ...parameters };

  // extracting env-specific params from parameters object
  envSpecificParamsName.forEach((paramName) => {
    if (paramName in parameters) {
      envSpecificParams[paramName] = parameters[paramName];
      delete sharedParams[paramName];
    }
  });

  const jsonString = JSON.stringify(sharedParams, null, 4);
  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  context.amplify.saveEnvResourceParameters(context, category, resource, envSpecificParams);
  return parameters;
}

function loadResourceParameters(context, category, resource) {
  let parameters = {};
  const resourceDirPath = getResourceDirPath(context, category, resource);

  const parametersBuildFilePath = path.join(resourceDirPath, 'build', 'parameters.json');
  const parametersFilePath = path.join(resourceDirPath, 'parameters.json');
  if (fs.existsSync(parametersBuildFilePath)) {
    parameters = context.amplify.readJsonFile(parametersBuildFilePath);
  } else if (fs.existsSync(parametersFilePath)) {
    parameters = context.amplify.readJsonFile(parametersFilePath);
  }
  const envSpecificParams = context.amplify.loadEnvResourceParameters(context, category, resource);
  return { ...parameters, ...envSpecificParams };
}

module.exports = {
  loadResourceParameters,
  saveResourceParameters,
};
