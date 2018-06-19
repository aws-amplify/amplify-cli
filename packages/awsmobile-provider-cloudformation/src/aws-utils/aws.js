const aws = require('aws-sdk');
const configurationManager = require('../../lib/configuration-manager');

// AWS promise with configuration through Odin
aws.configureWithCreds = context => new Promise((resolve) => {
    configurationManager.loadProjectConfig(context, aws); 
    aws.config.setPromisesDependency(Promise);
    resolve(aws);
})


module.exports = aws;
