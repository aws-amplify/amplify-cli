const fs = require('fs');
const path = require('path');
const Table = require('cli-table2');
const pathManager = require('./path-manager');

function getResourceStatus(category, resourceName) {
	const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
	let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

	const currentAwsmobileMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
	let currentAwsmobileMeta = JSON.parse(fs.readFileSync(currentAwsmobileMetaFilePath));

	let resourcesToBeCreated = getResourcesToBeCreated(awsmobileMeta, currentAwsmobileMeta, category, resourceName);
	let resourcesToBeUpdated = getResourcesToBeUpdated(awsmobileMeta, currentAwsmobileMeta, category, resourceName);
	let resourcesToBeDeleted = getResourcesToBeDeleted(awsmobileMeta, currentAwsmobileMeta, category, resourceName);

	resourcesToBeCreated = resourcesToBeCreated.filter((resource) => resource.category !== "provider");

	showResourceTable(resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted);

	return {resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted};

}

function showResourceTable(resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted) {
	const createOperationLabel = 'Create';
	const updateOperationLabel = 'Update';
	const deleteOperationLabel = 'Delete';
	let table = new Table({
    	head: ['Category', 'Resource name', 'Operation', 'Provider plugin']
	});
	for(let i = 0; i < resourcesToBeCreated.length; i++) {
		table.push([capitalize(resourcesToBeCreated[i].category), resourcesToBeCreated[i].resourceName, createOperationLabel, resourcesToBeCreated[i].providerPlugin]);
	}
	for(let i = 0; i < resourcesToBeUpdated.length; i++) {
		table.push([capitalize(resourcesToBeUpdated[i].category), resourcesToBeUpdated[i].resourceName, updateOperationLabel, resourcesToBeUpdated[i].providerPlugin]);
	}
	for(let i = 0; i < resourcesToBeDeleted.length; i++) {
		table.push([capitalize(resourcesToBeDeleted[i].category), resourcesToBeDeleted[i].resourceName, deleteOperationLabel, resourcesToBeDeleted[i].providerPlugin]);
	}
	console.log(table.toString());
}

function getResourcesToBeCreated(awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
	let resources = [];

	Object.keys((awsmobileMeta)).forEach((category) => {
		let categoryItem = awsmobileMeta[category];
		Object.keys((categoryItem)).forEach((resource) => {
			if(!currentAwsmobileMeta[category] || !currentAwsmobileMeta[category][resource]) {
				awsmobileMeta[category][resource].resourceName = resource;
				awsmobileMeta[category][resource].category = category;
				resources.push(awsmobileMeta[category][resource]);
			}
		});
	});

	if(category !== undefined && resourceName !== undefined) {
		// Create only specified resource in the cloud
		resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
	}

	if(category !== undefined && !resourceName) {
		// Create all the resources for the specified category in the cloud
		resources = resources.filter((resource) => resource.category === category);
	}

	return resources;
}

function getResourcesToBeDeleted(awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
	let resources = [];

	Object.keys((currentAwsmobileMeta)).forEach((category) => {
		let categoryItem = currentAwsmobileMeta[category];
		Object.keys((categoryItem)).forEach((resource) => {
			if(!awsmobileMeta[category] || !awsmobileMeta[category][resource]) {
				currentAwsmobileMeta[category][resource].resourceName = resource;
				currentAwsmobileMeta[category][resource].category = category;

				resources.push(currentAwsmobileMeta[category][resource]);
			}
		});
	});

	if(category !== undefined && resourceName !== undefined) {
		// Deletes only specified resource in the cloud
		resources = resources.filter((resource) => resource.category === category && resource.resourceName === resourceName);
	}

	if(category !== undefined && !resourceName) {
		// Deletes all the resources for the specified category in the cloud
		resources = resources.filter((resource) => resource.category === category);
	}


	return resources;
}

function getResourcesToBeUpdated(awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
	let resources = [];

	Object.keys((awsmobileMeta)).forEach((category) => {
		let categoryItem = awsmobileMeta[category];
		Object.keys((categoryItem)).forEach((resource) => {
			if(currentAwsmobileMeta[category]) {
				if(currentAwsmobileMeta[category][resource] !== undefined && awsmobileMeta[category][resource] !== undefined) {
					if(isBackendDirModifiedSinceLastPush(resource, category, currentAwsmobileMeta[category][resource].lastPushTimeStamp)) {
						awsmobileMeta[category][resource].resourceName = resource;
						awsmobileMeta[category][resource].category = category;
						resources.push(awsmobileMeta[category][resource]);
					}
				}
			}
		});
	});

	return resources;
}

function isBackendDirModifiedSinceLastPush(resourceName, category, lastPushTimeStamp) {
	// Pushing the resource for the first time hence no lastPushTimeStamp
	if(!lastPushTimeStamp) {
		return false
	}
	let backEndDir = pathManager.getBackendDirPath();
	let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
	let dirStats = fs.statSync(resourceDir);
	let lastModifiedDirTime = dirStats.atime;

	if(new Date(lastModifiedDirTime) > new Date(lastPushTimeStamp)) {
		return true;
	}

	return false;
}

function capitalize(str) {
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
 	getResourceStatus
}