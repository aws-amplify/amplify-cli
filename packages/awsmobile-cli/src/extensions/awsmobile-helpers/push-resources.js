const fs = require('fs');
const path = require('path');
const ora = require('ora');
const Table = require('cli-table2');
const pathManager = require('./path-manager');
const getProviderPlugins = require('./get-provider-plugins').getPlugins;
const updateAwsmobileMeta = require('./update-awsmobile-meta').updateAwsmobileMeta
const getResourceStatus = require('./get-resource-status').getResourceStatus;
let spinner;

function pushResources(context) {
	const {print} = context;
	getResourceStatus();

	return context.prompt.confirm('Are you sure you want to continue?')
		.then((answer) => {
			if(answer) {
				let providerPlugins = getProviderPlugins();
				let providerPromises = [];

				for(let i = 0; i < providerPlugins.length; i++) {
					let pluginPath = providerPlugins[i].path || providerPlugins[i].plugin;
					let pluginModule = require(pluginPath);
					providerPromises.push(pluginModule.pushResources(context));
				}
				spinner = ora('Updating resources in the cloud. This may take a few minutes...').start();
				return Promise.all(providerPromises);
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

module.exports = {
    pushResources
}