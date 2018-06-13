
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var getWhen = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/get-when-function').getWhen;
var getProjectDetails = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/get-project-details').getProjectDetails;
var validator = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/input-validation').inputValidation;
var getDefaults = require('../get-defaults')
var servicedMetadata;
var supportedServices;
var cfnFilename;

function serviceWalkthrough(service, context) {

	let inputs = serviceMetadata.inputs;

	let questions = [];
	for(let i = 0; i < inputs.length; i++) {
		// Can have a cool question builder function here based on input json - will iterate on this
		// Can also have some validations here based on the input json
		//Uncool implementation here 

		let question = {
			name: inputs[i].key,
			message: inputs[i].question,
			when: getWhen(inputs[i]),
			validate: validator(inputs[i]),
			default: (answers) => {
				let inputs = serviceMetadata.inputs;
				const defaultValue = getDefaults.getAllDefaults(getProjectDetails())[inputs[i].key];

				if (defaultValue && answers.resourceName) {
					return defaultValue.replace(/<name>/g, answers.resourceName) 
				} else if (defaultValue) {
					return defaultValue
				} else {
					return undefined;
				}
			}
		}

		if(inputs[i].type && inputs[i].type == "list") {
			question = Object.assign({
				type: 'list',
				choices: inputs[i].options
			}, question);
		} else if (inputs[i].type && inputs[i].type === 'multiselect') {
			question = Object.assign({
				type: 'checkbox',
				choices: inputs[i].options
			}, question)
		} else {
			question = Object.assign({
				type: 'input',
			}, question);
		}
		questions.push(question);
	}

	return inquirer.prompt(questions);
}


function copyCfnTemplate(context, category, options) {

	const {awsmobile} = context;
	let targetDir = awsmobile.pathManager.getBackendDirPath();
	let pluginDir = __dirname;

	const copyJobs = [
		{
			dir: pluginDir, 
			template: 'cloudformation-templates/' + cfnFilename, 
			target: targetDir + '/' + category + '/' + options.resourceName + '/' +  options.resourceName + '-' + 'cloudformation-template.yml'
		}
	];

	// copy over the files
  	return context.awsmobile.copyBatch(context, copyJobs, options);
}

function addResource(context, category, service, configure) {
	
	let props = {};

	serviceMetadata = JSON.parse(fs.readFileSync(__dirname + `/../supported-services${configure}.json`))[service];
	supportedServices = Object.keys(serviceMetadata);
	cfnFilename = serviceMetadata.cfnFilename;

	return serviceWalkthrough(service, context)
		.then((result) => {

			// for each auth selection made by user, populate defaults associated with the choice into props object
			result.authSelections.forEach((i) => {
				props = Object.assign(props, getDefaults.functionMap[i](result.resourceName))
			})

			// merge actual answers object into props object of defaults answers, ensuring that manual entries override defaults
			props = Object.assign(props, result);

			// make sure that resource name populates '<name'> placeholder from default if it hasn't already
			// TODO: improve this
			Object.keys(props).forEach((el) => {
				if (typeof props[el] === 'string'){
					props[el] = props[el].replace(/<name>/g, props.resourceName)
				}
			})

			copyCfnTemplate(context, category, props)
		})
		.then(() => {
			return props.resourceName
		});
}

module.exports = {addResource}; 