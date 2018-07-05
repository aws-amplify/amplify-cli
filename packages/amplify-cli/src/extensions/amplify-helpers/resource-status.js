const fs = require('fs');
const path = require('path');
const Table = require('cli-table2');
const pathManager = require('./path-manager');

function isBackendDirModifiedSinceLastPush(resourceName, category, lastPushTimeStamp) {
  // Pushing the resource for the first time hence no lastPushTimeStamp
  if (!lastPushTimeStamp) {
    return false;
  }
  let lastModifiedDirTime;
  const backEndDir = pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  const srcDir = path.normalize(path.join(backEndDir, category, resourceName, 'src'));
  const dirStats = fs.statSync(resourceDir);
  if (fs.existsSync(srcDir)){
    const srcDirStats = fs.statSync(srcDir);
    lastModifiedDirTime = new Date(srcDirStats.atime) > new Date(dirStats.atime) ? srcDirStats.atime : dirStats.atime;
  } else {
    lastModifiedDirTime = dirStats.atime;
  }

  if (new Date(lastModifiedDirTime) > new Date(lastPushTimeStamp)) {
    return true;
  }

  return false;
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
      if (!currentamplifyMeta[categoryName] || !currentamplifyMeta[categoryName][resource]) {
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

  return resources;
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

function getResourcesToBeUpdated(amplifyMeta, currentamplifyMeta, category, resourceName) {
  let resources = [];

  Object.keys((amplifyMeta)).forEach((categoryName) => {
    const categoryItem = amplifyMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      if (currentamplifyMeta[categoryName]) {
        if (currentamplifyMeta[categoryName][resource] !== undefined &&
            amplifyMeta[categoryName][resource] !== undefined) {
          if (isBackendDirModifiedSinceLastPush(
            resource,
            categoryName,
            currentamplifyMeta[categoryName][resource].lastPushTimeStamp,
          )) {
            amplifyMeta[categoryName][resource].resourceName = resource;
            amplifyMeta[categoryName][resource].category = categoryName;
            resources.push(amplifyMeta[categoryName][resource]);
          }
        }
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


function getResourceStatus(category, resourceName) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  const currentamplifyMetaFilePath = pathManager.getCurentBackendCloudamplifyMetaFilePath();
  const currentamplifyMeta = JSON.parse(fs.readFileSync(currentamplifyMetaFilePath));

  let resourcesToBeCreated = getResourcesToBeCreated(
    amplifyMeta,
    currentamplifyMeta,
    category,
    resourceName,
  );
  const resourcesToBeUpdated = getResourcesToBeUpdated(
    amplifyMeta,
    currentamplifyMeta,
    category,
    resourceName,
  );
  const resourcesToBeDeleted = getResourcesToBeDeleted(
    amplifyMeta,
    currentamplifyMeta,
    category,
    resourceName,
  );

  const allResources = getAllResources(
    amplifyMeta,
    category,
    resourceName,
  );

  resourcesToBeCreated = resourcesToBeCreated.filter(resource => resource.category !== 'provider');

  return { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, allResources };
}

function showResourceTable(category, resourceName) {
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted
  } = getResourceStatus(category, resourceName);
  const createOperationLabel = 'Create';
  const updateOperationLabel = 'Update';
  const deleteOperationLabel = 'Delete';
  const table = new Table({
    head: ['Category', 'Resource name', 'Operation', 'Provider plugin'],
  });
  for (let i = 0; i < resourcesToBeCreated.length; i += 1) {
    table.push([
      capitalize(resourcesToBeCreated[i].category),
      resourcesToBeCreated[i].resourceName,
      createOperationLabel,
      resourcesToBeCreated[i].providerPlugin]);
  }
  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    table.push([
      capitalize(resourcesToBeUpdated[i].category),
      resourcesToBeUpdated[i].resourceName,
      updateOperationLabel,
      resourcesToBeUpdated[i].providerPlugin]);
  }
  for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
    table.push([
      capitalize(resourcesToBeDeleted[i].category),
      resourcesToBeDeleted[i].resourceName,
      deleteOperationLabel,
      resourcesToBeDeleted[i].providerPlugin]);
  }
  console.log(table.toString());
}

module.exports = {
  getResourceStatus,
  showResourceTable,
};
