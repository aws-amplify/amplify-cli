var aws = require('aws-sdk');

// AWS promise with configuration through Odin
aws.configureWithCreds = (context) => {
    return new Promise((resolve) => {
        resolve(withDefaultConfiguration(aws, context));
    });
};

function withDefaultConfiguration(aws, context) {
	// Fetch access key, secret key and region from context based on provider
    // Part of init/config
    let creds = {
		"accessKey": "AKIAI5LD6XA6YBWCTR2Q",
		"secretKey": "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",
		"region": "us-east-1"
	};
    return setAWSConfig(aws, creds.accessKey, creds.secretKey, creds.region);	    
}

function setAWSConfig(aws, access, secret, region) {
    aws.config.update({
        region: region,
        accessKeyId: access,
        secretAccessKey: secret
    });
    aws.config.setPromisesDependency(Promise);
    return aws;
}


module.exports = aws;