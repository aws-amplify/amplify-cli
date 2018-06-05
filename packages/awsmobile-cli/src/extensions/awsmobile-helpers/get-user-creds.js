var fs = require('fs');
var pathManager = require('./path-manager')

function getUserCreds(provider) {
	// Based on the provider fetch the creds
	// Logic here should be modififed as  a part of init/config command

	return {
		"accessKey": "AKIAI5MRALZUEILN75QQ",
		"secretKey": "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",
		"region": "us-west-2"
	};
}

module.exports = {
 	getUserCreds
}