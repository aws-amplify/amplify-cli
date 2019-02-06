const aws = require('./aws.js');

class MobileHub {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.mobileHub = new awsItem.MobileHub();
        return this;
      });
  }
  static getProjectResources(projectId) {
    console.log(projectId);
    return new Promise((resolve) => {
      resolve('{"auth":{"cognito54764da0":{"service":"Cognito","output":{"IdentityPoolId":"us-west-2:ff79e4c5-6152-4b45-8a2c-6369814d4982","IdentityPoolName":"amplifyjsapp_identitypool_f7134f4a"}}},"analytics":{"amplifyjsapp":{"service":"Pinpoint","output":{"appName":"amplifyjsapp","Region":"us-west-2","Id":"1e6f04d9642b485095a0ed2cfeaabbc0"}}},"storage":{"s3ba19bb15":{"service":"S3"},"dynamo21b8f04d":{"service":"DynamoDB"}},"function":{"amplifyjsapp995975c7":{"service":"Lambda","build":true,"dependsOn":[{"category":"storage","resourceName":"dynamo21b8f04d","attributes":["Name","Arn"]}]}},"api":{"apie8f27416":{"service":"APIGateway","dependsOn":[{"category":"function","resourceName":"amplifyjsapp995975c7","attributes":["Name","Arn"]}]}},"interactions":{"lex7a924947":{"service":"Lex","build":true}}}');
    });
  }
}
module.exports = MobileHub;
