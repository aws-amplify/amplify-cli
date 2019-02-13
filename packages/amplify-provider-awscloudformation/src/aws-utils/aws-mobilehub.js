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
      resolve('{"auth":{"cognito54764da0":{"service":"Cognito","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"IdentityPoolId":"us-west-2:ff79e4c5-6152-4b45-8a2c-6369814d4982","IdentityPoolName":"amplifyjsapp_identitypool_f7134f4a"}}},"analytics":{"amplifyjsapp":{"service":"Pinpoint","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"appName":"migrate_MobileHub","Region":"us-west-2","Id":"429748d632a04f96b43a8e8c17ef7ef5"}}},"storage":{"s3ba19bb15":{"service":"S3","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"BucketName":"migrate-userfiles-mobilehub-45973183","Region":"us-west-2"}},"dynamo21b8f04d":{"service":"DynamoDB","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","output":{"PartitionKeyName":"category","Region":"us-west-2","Arn":"arn:aws:dynamodb:us-west-2:148827594313:table/migrate-mobilehub-45973183-News","PartitionKeyType":"S","Name":"migrate-mobilehub-45973183-News"}}},"function":{"amplifyjsapp995975c7":{"service":"Lambda","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","build":true,"dependsOn":[{"category":"storage","resourceName":"dynamo21b8f04d","attributes":["Name","Arn"]}],"output":{"Region":"us-west-2","Arn":"arn:aws:lambda:us-west-2:148827594313:function:testapi-itemsHandler-mobilehub-45973183","Name":"testapi-itemsHandler-mobilehub-45973183"}}},"api":{"apie8f27416":{"service":"APIGateway","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","dependsOn":[{"category":"function","resourceName":"amplifyjsapp995975c7","attributes":["Name","Arn"]}],"output":{"ApiName":"c1nlkozbs4","RootUrl":"https://bp7g1u7boi.execute-api.us-west-2.amazonaws.com/Development/"}}},"interactions":{"lex7a924947":{"service":"Lex","lastPushTimeStamp":"2019-02-11T07:42:35.438Z","build":true,"output":{"FunctionArn":"BookTripMOBILEHUB","Region":"us-west-2","BotName":"BookTripMOBILEHUB"}}},"env":false}');
    });
  }
}
module.exports = MobileHub;
