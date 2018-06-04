var aws = require('aws-sdk');

// AWS promise with configuration through Odin
aws.configureWithCreds = (context) => {
    if (aws.config.credentials) {
        return Promise.resolve(aws);
    } else {
        return Promise.resolve(withDefaultConfiguration(aws, context));
    }
};

function withDefaultConfiguration(aws, context) {
	// Fetch access key, secret key and region from context based on provider
    // Part of init/config
    let creds = context.awsmobile.getUserCreds();

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