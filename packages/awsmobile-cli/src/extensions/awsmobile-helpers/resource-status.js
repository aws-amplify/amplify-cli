const fs = require('fs');
const path = require('path');
const Table = require('cli-table2');
const pathManager = require('./path-manager');

function isBackendDirModifiedSinceLastPush(resourceName, category, lastPushTimeStamp) {
  // Pushing the resource for the first time hence no lastPushTimeStamp
  if (!lastPushTimeStamp) {
    return false;
  }
  const backEndDir = pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  const dirStats = fs.statSync(resourceDir);
  const lastModifiedDirTime = dirStats.atime;

  if (new Date(lastModifiedDirTime) > new Date(lastPushTimeStamp)) {
    return true;
  }

  return false;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getResourcesToBeCreated(awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
  let resources = [];

  Object.keys((awsmobileMeta)).forEach((categoryName) => {
    const categoryItem = awsmobileMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      if (!currentAwsmobileMeta[categoryName] || !currentAwsmobileMeta[categoryName][resource]) {
        awsmobileMeta[categoryName][resource].resourceName = resource;
        awsmobileMeta[categoryName][resource].category = categoryName;
        resources.push(awsmobileMeta[categoryName][resource]);
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

function getResourcesToBeDeleted(awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
  let resources = [];

  Object.keys((currentAwsmobileMeta)).forEach((categoryName) => {
    const categoryItem = currentAwsmobileMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      if (!awsmobileMeta[categoryName] || !awsmobileMeta[categoryName][resource]) {
        currentAwsmobileMeta[categoryName][resource].resourceName = resource;
        currentAwsmobileMeta[categoryName][resource].category = categoryName;

        resources.push(currentAwsmobileMeta[categoryName][resource]);
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

function getResourcesToBeUpdated(awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
  let resources = [];

  Object.keys((awsmobileMeta)).forEach((categoryName) => {
    const categoryItem = awsmobileMeta[categoryName];
    Object.keys((categoryItem)).forEach((resource) => {
      if (currentAwsmobileMeta[categoryName]) {
        if (currentAwsmobileMeta[categoryName][resource] !== undefined &&
            awsmobileMeta[categoryName][resource] !== undefined) {
          if (isBackendDirModifiedSinceLastPush(
            resource,
            categoryName,
            currentAwsmobileMeta[categoryName][resource].lastPushTimeStamp,
          )) {
            awsmobileMeta[categoryName][resource].resourceName = resource;
            awsmobileMeta[categoryName][resource].category = categoryName;
            resources.push(awsmobileMeta[categoryName][resource]);
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
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

  const currentAwsmobileMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
  const currentAwsmobileMeta = JSON.parse(fs.readFileSync(currentAwsmobileMetaFilePath));

  let resourcesToBeCreated = getResourcesToBeCreated(
    awsmobileMeta,
    currentAwsmobileMeta,
    category,
    resourceName,
  );
  const resourcesToBeUpdated = getResourcesToBeUpdated(
    awsmobileMeta,
    currentAwsmobileMeta,
    category,
    resourceName,
  );
  const resourcesToBeDeleted = getResourcesToBeDeleted(
    awsmobileMeta,
    currentAwsmobileMeta,
    category,
    resourceName,
  );

  resourcesToBeCreated = resourcesToBeCreated.filter(resource => resource.category !== 'provider');

  return { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted };
}

function showResourceTable(category, resourceName) {
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

  const currentAwsmobileMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
  const currentAwsmobileMeta = JSON.parse(fs.readFileSync(currentAwsmobileMetaFilePath));

  const resourcesToBeCreated = getResourcesToBeCreated(
    awsmobileMeta,
    currentAwsmobileMeta,
    category,
    resourceName,
  );
  const resourcesToBeUpdated = getResourcesToBeUpdated(
    awsmobileMeta,
    currentAwsmobileMeta,
    category,
    resourceName,
  );
  const resourcesToBeDeleted = getResourcesToBeDeleted(
    awsmobileMeta,
    currentAwsmobileMeta,
    category,
    resourceName,
  );

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
