const fs = require('fs');
const path = require('path');
const ora = require('ora');
const pathManager = require('./path-manager');
const getProviderPlugins = require('./get-provider-plugins').getPlugins;
const updateAwsmobileMeta = require('./update-awsmobile-meta').updateAwsmobileMeta

function pushResources(context, category, resourceName) {
	const {print} = context;
	const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
	let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

	const currentAwsmobileMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
	let currentAwsmobileMeta = JSON.parse(fs.readFileSync(currentAwsmobileMetaFilePath));

	let resourcesToBeCreated = getResourcesToBeCreated(context, awsmobileMeta, currentAwsmobileMeta, category, resourceName);
	let resourcesToBeUpdated = getResourcesToBeUpdated(context, awsmobileMeta, currentAwsmobileMeta, category, resourceName);
	let resourcesToBeDeleted = getResourcesToBeDeleted(context, awsmobileMeta, currentAwsmobileMeta, category, resourceName);
	let promises = [];
	promises.push(createResources(context, category, resourcesToBeCreated));
	promises.push(updateResources(context, category, resourcesToBeUpdated));
	promises.push(deleteResources(context, category, resourcesToBeDeleted));
	let spinner;

	return context.prompt.confirm('Are you sure you want to continue?')
		.then((answer) => {
			if(answer) {
				spinner = ora('Updating resources in the cloud. This may take a few minutes...').start();
				return Promise.all(promises);
			} else {
				process.exit(1);
			}
		})
		.then(() => {
			spinner.succeed('All resources updated are updated in the cloud');
		})
		.catch((err) => {
			spinner.fail('There was an issue pushing the resources to the cloud');
			context.print.info(err.stack);
		});
}

function createResources(context, category, resourcesToBeCreated) {

	let createResourcePromises = [];
	let providerPlugins = getProviderPlugins();

	for(let i = 0; i < resourcesToBeCreated.length; i++) {
		let providerPlugin = resourcesToBeCreated[i].providerPlugin;
		let resourceName = resourcesToBeCreated[i].resourceName;

		let providerDetails = providerPlugins.find((item) => item.plugin === providerPlugin);
		if(!providerDetails) {
			print.error("Provider plugin not found: " + providerPlugin + ' for resource: ' + resourcesToBeCreated[i].resourceName);
			continue;
		}
		let pluginPath = providerDetails.path || providerDetails.package;
		let pluginModule = require(pluginPath);

		createResourcePromises.push(pluginModule.createResource(context, category, resourceName));
	}

	return Promise.all(createResourcePromises);
}

function updateResources(context, category, resourcesToBeUpdated) {

	let updateResourcePromises = [];
	let providerPlugins = getProviderPlugins();

	for(let i = 0; i < resourcesToBeUpdated.length; i++) {
		let providerPlugin = resourcesToBeUpdated[i].providerPlugin;
		let resourceName = resourcesToBeUpdated[i].resourceName;

		let providerDetails = providerPlugins.find((item) => item.plugin === providerPlugin);
		if(!providerDetails) {
			print.error("Provider plugin not found: " + providerPlugin + ' for resource: ' + resourcesToBeUpdated[i].resourceName);
			continue;
		}
		let pluginPath = providerDetails.path || providerDetails.package;
		let pluginModule = require(pluginPath);

		updateResourcePromises.push(pluginModule.updateResource(context, category, resourceName));
	}

	return Promise.all(updateResourcePromises);
}

function deleteResources(context, category, resourcesToBeDeleted) {

	let deleteResourcePromises = [];
	let providerPlugins = getProviderPlugins();

	for(let i = 0; i < resourcesToBeDeleted.length; i++) {
		let providerPlugin = resourcesToBeDeleted[i].providerPlugin;
		let resourceName = resourcesToBeDeleted[i].resourceName;

		let providerDetails = providerPlugins.find((item) => item.plugin === providerPlugin);

		if(!providerDetails) {
			context.print.error("Provider plugin not found: " + providerPlugin + ' for resource: ' + resourcesToBeDeleted[i].resourceName);
			continue;
		}
		let pluginPath = providerDetails.path || providerDetails.package;
		let pluginModule = require(pluginPath);

		deleteResourcePromises.push(pluginModule.deleteResource(context, category, resourceName));
	}

	return Promise.all(deleteResourcePromises);
}

function getResourcesToBeCreated(context, awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
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

	console.log("Resources to be created");
	console.log("________________________");
	console.log(resources);

	return resources;
}

function getResourcesToBeDeleted(context, awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
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

	console.log("Resources to be deleted");
	console.log("________________________");
	console.log(resources);

	return resources;
}

function getResourcesToBeUpdated(context, awsmobileMeta, currentAwsmobileMeta, category, resourceName) {
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

	console.log("Resources to be updated");
	console.log("________________________");
	console.log(resources);

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

module.exports = {
    pushResources
}