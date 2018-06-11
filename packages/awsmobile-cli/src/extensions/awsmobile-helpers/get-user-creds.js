var fs = require('fs');
var pathManager = require('./path-manager')

function getUserCreds(provider) {
	// Based on the provider fetch the creds
	// Logic here should be modififed as  a part of init/config command

	return {
		"accessKey": "<your access key>",
		"secretKey": "<your secret key>",
		"region": "<your-region>"
	};
}

module.exports = {
 	getUserCreds
}