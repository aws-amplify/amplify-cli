var aws = require('aws-sdk');

// AWS promise with configuration through Odin
aws.configureWithCreds = () => {
    if (aws.config.credentials) {
        return Promise.resolve(aws);
    } else {
        return Promise.resolve(withDefaultConfiguration(aws));
    }
};

function withDefaultConfiguration(aws) {
	// Fetch access key, secret key and region from context based on provider
    // Part of init/config

    return setAWSConfig(aws,"<your accesskey>","<your secret key>","<your region>");	    
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