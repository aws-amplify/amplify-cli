
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var servicedMetadata;
var supportedServices;
var cfnFilename;

function serviceWalkthrough(service) {
	let inputs = serviceMetadata.inputs;
	let questions = [];
	for(let i = 0; i < inputs.length; i++) {
		// Can have a cool question builder function here based on input json - will iterate on this
		// Can also have some validations here based on the input json
		//Uncool implementation here 
		if(inputs[i].options) {
			let question = {
				name: inputs[i].key,
				message: inputs[i].question,
				type: 'list',
				choices: inputs[i].options
			};
			questions.push(question);
		} else {
			let question = {
				name: inputs[i].key,
				message: inputs[i].question,
				type: 'input'
			};
			questions.push(question);
		}
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

function addResource(context, category, service) {
	let answers;
	serviceMetadata = JSON.parse(fs.readFileSync(__dirname + '/../supported-services.json'))[service];
	supportedServices = Object.keys(serviceMetadata);
	cfnFilename = serviceMetadata.cfnFilename;

	return serviceWalkthrough(service)
		.then((result) => {
			answers = result;
			copyCfnTemplate(context, category, answers)
		})
		.then(() => {
			return answers.resourceName
		});
}

function createResource(context, category, resourceName) {
	let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
	let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
	let files = fs.readdirSync(resourceDir);

	// Fetch all the Cloudformation templates (can be json or yml)

	let cfnFiles = files.filter(function(file){
    	return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
	});

	return new CloudFormation(context)
		.then((cfnItem) => {
			return cfnItem.createResources(resourceDir, cfnFiles, category, resourceName);
		});
}

function deleteResource(context, category, resourceName) {
	let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
	let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
	let files = fs.readdirSync(resourceDir);

	// Fetch all the Cloudformation templates (can be json or yml)

	let cfnFiles = files.filter(function(file){
    	return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
	});

	return new CloudFormation(context)
		.then((cfnItem) => {
			return cfnItem.deleteResources(resourceDir, cfnFiles, category, resourceName);
		});
}


module.exports = {addResource, createResource, deleteResource}; 