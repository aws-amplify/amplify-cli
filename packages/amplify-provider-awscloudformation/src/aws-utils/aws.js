const aws = require('aws-sdk');
const configurationManager = require('../../lib/configuration-manager');

aws.configureWithCreds = context => configurationManager.loadConfiguration(context, aws);


module.exports = aws;
