const fs = require('fs');
const path = require('path');
const { print } = require('gluegun/print');
const chalk = require('chalk');
const { hashElement } = require('folder-hash');
const pathManager = require('./path-manager');
const { getEnvInfo } = require('./get-env-info');
const _ = require('lodash');

async function isBackendDirModifiedSinceLastPush(resourceName, category, lastPushTimeStamp) {
  // Pushing the resource for the first time hence no lastPushTimeStamp
  if (!lastPushTimeStamp) {
    return false;
  }

  const localBackendDir = path.normalize(path.join(
    pathManager.getBackendDirPath(),
    category,
    resourceName,
  ));

  const cloudBackendDir = path.normalize(path.join(
    pathManager.getCurrentCloudBackendDirPath(),
    category,
    resourceName,
  ));

  if (!fs.existsSync(localBackendDir)) {
    return false;
  }

  const localDirHash = await getHashForResourceDir(localBackendDir);
  const cloudDirHash = await getHashForResourceDir(cloudBackendDir);


  if (localDirHash !== cloudDirHash) {
    return true;
  }

  return false;
}


function getHashForResourceDir(dirPath) {
  const options = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
  };

  return hashElement(dirPath, options)
    .then(result => result.hash);
}


function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getAllResources(amplifyMeta, category, resourceName) {
  let resources = [];

  Object.keys((amplifyMeta)).forEach((categoryName) => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      amplifyMeta[categoryName][resource].resourceName = resource;
      amplifyMeta[categoryName][resource].category = categoryName;
      resources.push(amplifyMeta[categoryName][resource]);
    });
  });

  if (category !== undefined && resourceName !== undefined) {
    // Create only specified resource in the cloud
    resources = resources.filter(resource => resource.category === category &&
        resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    // Create all the resources for the specified category in the cloud
    resources = resources.filter(resource => resource.category === category);
  }

  return resources;
}

function getResourcesToBeCreated(amplifyMeta, currentamplifyMeta, category, resourceName) {
  let resources = [];

  Object.keys((amplifyMeta)).forEach((categoryName) => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      if ((!amplifyMeta[categoryName][resource].lastPushTimeStamp ||
          !currentamplifyMeta[categoryName] ||
          !currentamplifyMeta[categoryName][resource]) &&
          categoryName !== 'providers') {
        amplifyMeta[categoryName][resource].resourceName = resource;
        amplifyMeta[categoryName][resource].category = categoryName;
        resources.push(amplifyMeta[categoryName][resource]);
      }
    });
  });

  if (category !== undefined && resourceName !== undefined) {
    // Create only specified resource in the cloud
    resources = resources.filter(resource => resource.category === category &&
        resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    // Create all the resources for the specified category in the cloud
    resources = resources.filter(resource => resource.category === category);
  }

  // Check for dependencies and add them

  for (let i = 0; i < resources.length; i += 1) {
    if (resources[i].dependsOn && resources[i].dependsOn.length > 0) {
      for (let j = 0; j < resources[i].dependsOn.length; j += 1) {
        const dependsOnCategory = resources[i].dependsOn[j].category;
        const dependsOnResourcename = resources[i].dependsOn[j].resourceName;
        if ((!amplifyMeta[dependsOnCategory][dependsOnResourcename].lastPushTimeStamp ||
          !currentamplifyMeta[dependsOnCategory] ||
          !currentamplifyMeta[dependsOnCategory][dependsOnResourcename])) {
          resources.push(amplifyMeta[dependsOnCategory][dependsOnResourcename]);
        }
      }
    }
  }

  return _.uniqWith(resources, _.isEqual);
}

function getResourcesToBeDeleted(amplifyMeta, currentamplifyMeta, category, resourceName) {
  let resources = [];

  Object.keys((currentamplifyMeta)).forEach((categoryName) => {
    const categoryItem = currentamplifyMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      if (!amplifyMeta[categoryName] || !amplifyMeta[categoryName][resource]) {
        currentamplifyMeta[categoryName][resource].resourceName = resource;
        currentamplifyMeta[categoryName][resource].category = categoryName;

        resources.push(currentamplifyMeta[categoryName][resource]);
      }
    });
  });

  if (category !== undefined && resourceName !== undefined) {
    // Deletes only specified resource in the cloud
    resources = resources.filter(resource => resource.category === category &&
        resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    // Deletes all the resources for the specified category in the cloud
    resources = resources.filter(resource => resource.category === category);
  }


  return resources;
}

async function getResourcesToBeUpdated(amplifyMeta, currentamplifyMeta, category, resourceName) {
  let resources = [];

  await asyncForEach(Object.keys((amplifyMeta)), async (categoryName) => {
    const categoryItem = amplifyMeta[categoryName];
    await asyncForEach(Object.keys((categoryItem)), async (resource) => {
      if (currentamplifyMeta[categoryName]) {
        if (currentamplifyMeta[categoryName][resource] !== undefined &&
            amplifyMeta[categoryName][resource] !== undefined) {
          const backendModified = await isBackendDirModifiedSinceLastPush(
            resource,
            categoryName,
            currentamplifyMeta[categoryName][resource].lastPushTimeStamp,
          );

          if (backendModified) {
            amplifyMeta[categoryName][resource].resourceName = resource;
            amplifyMeta[categoryName][resource].category = categoryName;
            resources.push(amplifyMeta[categoryName][resource]);
          }
        }
      }
    });
  });

  if (category !== undefined && resourceName !== undefined) {
    resources = resources.filter(resource => resource.category === category &&
        resource.resourceName === resourceName);
  }

  if (category !== undefined && !resourceName) {
    resources = resources.filter(resource => resource.category === category);
  }

  return resources;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
}


async function getResourceStatus(category, resourceName, providerName) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  const currentamplifyMetaFilePath = pathManager.getCurentAmplifyMetaFilePath();
  const currentamplifyMeta = JSON.parse(fs.readFileSync(currentamplifyMetaFilePath));

  let resourcesToBeCreated = getResourcesToBeCreated(
    amplifyMeta,
    currentamplifyMeta,
    category,
    resourceName,
  );
  let resourcesToBeUpdated = await getResourcesToBeUpdated(
    amplifyMeta,
    currentamplifyMeta,
    category,
    resourceName,
  );
  let resourcesToBeDeleted = getResourcesToBeDeleted(
    amplifyMeta,
    currentamplifyMeta,
    category,
    resourceName,
  );

  let allResources = getAllResources(
    amplifyMeta,
    category,
    resourceName,
  );

  resourcesToBeCreated = resourcesToBeCreated.filter(resource => resource.category !== 'provider');

  if (providerName) {
    resourcesToBeCreated = resourcesToBeCreated.filter(resource =>
      resource.providerPlugin === providerName);
    resourcesToBeUpdated = resourcesToBeUpdated.filter(resource =>
      resource.providerPlugin === providerName);
    resourcesToBeDeleted = resourcesToBeDeleted.filter(resource =>
      resource.providerPlugin === providerName);
    allResources = allResources.filter(resource =>
      resource.providerPlugin === providerName);
  }

  return {
    resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, allResources,
  };
}

async function showResourceTable(category, resourceName) {
  const { envName } = getEnvInfo();

  print.info('');
  print.info(`${chalk.green('Current Environment')}: ${envName}`);
  print.info('');


  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    allResources,
  } = await getResourceStatus(category, resourceName);

  let noChangeResources = _.differenceWith(
    allResources,
    resourcesToBeCreated.concat(resourcesToBeUpdated),
    _.isEqual,
  );
  noChangeResources = noChangeResources.filter(resource => resource.category !== 'providers');

  const createOperationLabel = 'Create';
  const updateOperationLabel = 'Update';
  const deleteOperationLabel = 'Delete';
  const noOperationLabel = 'No Change';
  const tableOptions = [['Category', 'Resource name', 'Operation', 'Provider plugin']];
  for (let i = 0; i < resourcesToBeCreated.length; i += 1) {
    tableOptions.push([
      capitalize(resourcesToBeCreated[i].category),
      resourcesToBeCreated[i].resourceName,
      createOperationLabel,
      resourcesToBeCreated[i].providerPlugin]);
  }
  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    tableOptions.push([
      capitalize(resourcesToBeUpdated[i].category),
      resourcesToBeUpdated[i].resourceName,
      updateOperationLabel,
      resourcesToBeUpdated[i].providerPlugin]);
  }
  for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
    tableOptions.push([
      capitalize(resourcesToBeDeleted[i].category),
      resourcesToBeDeleted[i].resourceName,
      deleteOperationLabel,
      resourcesToBeDeleted[i].providerPlugin]);
  }
  for (let i = 0; i < noChangeResources.length; i += 1) {
    tableOptions.push([
      capitalize(noChangeResources[i].category),
      noChangeResources[i].resourceName,
      noOperationLabel,
      noChangeResources[i].providerPlugin]);
  }

  const { table } = print;

  table(
    tableOptions,
    { format: 'markdown' },
  );
}

module.exports = {
  getResourceStatus,
  showResourceTable,
};
