var fs = require('fs');
var categoryControllers = require("./src/category-controllers/category-controller-mapping");
const provider = 'awsmobile-cli-provider-cloudformation';

function addResource(context, category, service) {
  var categoryController = categoryControllers[category];
  return categoryController.addResource(context, category, service);
};

function getServices(context, category) {
	servicedMetadata = JSON.parse(fs.readFileSync(__dirname + '/src/category-controllers/supported-services.json'))[category];
	supportedServices = Object.keys(servicedMetadata);

	return supportedServices;
}

module.exports = { addResource, getServices }
