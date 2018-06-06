const fs = require('fs');
const path = require('path');
const ora = require('ora');
const Table = require('cli-table2');
const pathManager = require('./path-manager');
const getProviderPlugins = require('./get-provider-plugins').getPlugins;
const updateAwsmobileMeta = require('./update-awsmobile-meta').updateAwsmobileMeta
const getResourceStatus = require('./get-resource-status').getResourceStatus;

function pushResources(context, category, resourceName) {
	const {print} = context;
	const {resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted} = getResourceStatus(category);

	return context.prompt.confirm('Are you sure you want to continue?')
		.then((answer) => {
			if(answer) {
				let promises = [];
				promises.push(createResources(context, category, resourcesToBeCreated));
				promises.push(updateResources(context, category, resourcesToBeUpdated));
				promises.push(deleteResources(context, category, resourcesToBeDeleted));
				spinner = ora('Updating resources in the cloud. This may take a few minutes...').start();
				return Promise.all(promises);
			} else {
				process.exit(1);
			}
		})
		.then(() => spinner.succeed('All resources updated are updated in the cloud'))
		.catch((err) => {
			context.print.info(err.stack);
			spinner.fail('There was an issue pushing the resources to the cloud');
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
		let pluginPath = providerDetails.path || providerDetails.plugin;
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

module.exports = {
    pushResources
}