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
	// Fetch access key, secret key and region
    return setAWSConfig(aws,"AKIAI5LD6XA6YBWCTR2Q","5qyNG2i69KgqrLBzr0i7Muc3JjuNoYqURSiwmGRx","us-east-1");	    
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