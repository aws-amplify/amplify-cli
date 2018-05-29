var fs = require('fs');
var pathManager = require('./path-manager');

function updateAwsmobileMeta(category, resourceName, options) {
	const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
	let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
	if(!awsmobileMeta[category]) {
		awsmobileMeta[category] = {};
		awsmobileMeta[category][resourceName] = {};
	} else {
		if(!awsmobileMeta[category][resourceName]) {
			awsmobileMeta[category][resourceName] = {};
		}
	}

	awsmobileMeta[category][resourceName].options = options;
	
	let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
  	fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
}

module.exports = {
 	updateAwsmobileMeta
}