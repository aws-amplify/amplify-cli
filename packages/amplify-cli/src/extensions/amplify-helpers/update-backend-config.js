const fs = require('fs-extra');
const pathManager = require('./path-manager');

function updateBackendConfigAfterResourceAdd(category, resourceName, options) {
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));
  if (options.output) delete options.output;
  if (!backendConfig[category]) {
    backendConfig[category] = {};
  }
  if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
    backendConfig[category][resourceName] = options;
    const jsonString = JSON.stringify(backendConfig, null, '\t');
    fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
  }
}

function updateBackendConfigDependsOn(category, resourceName, value) {
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));

  if (!backendConfig[category]) {
    backendConfig[category] = {};
    backendConfig[category][resourceName] = {};
  } else if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
  }
  backendConfig[category][resourceName].dependsOn = value;

  const jsonString = JSON.stringify(backendConfig, null, 4);

  fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
}

function updateBackendConfigAfterResourceRemove(category, resourceName) {
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath));

  if (backendConfig[category][resourceName] !== undefined) {
    delete backendConfig[category][resourceName];
  }

  const jsonString = JSON.stringify(backendConfig, null, '\t');
  fs.writeFileSync(backendConfigFilePath, jsonString, 'utf8');
}


module.exports = {
  updateBackendConfigAfterResourceAdd,
  updateBackendConfigAfterResourceRemove,
  updateBackendConfigDependsOn,
};
