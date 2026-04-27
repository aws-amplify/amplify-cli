export type AmplifyDependentResourcesAttributes = {
  api: {
    adminapi: {
      ApiId: 'string';
      ApiName: 'string';
      RootUrl: 'string';
    };
    fitnesstracker: {
      GraphQLAPIEndpointOutput: 'string';
      GraphQLAPIIdOutput: 'string';
      GraphQLAPIKeyOutput: 'string';
    };
    nutritionapi: {
      ApiId: 'string';
      ApiName: 'string';
      RootUrl: 'string';
    };
  };
  auth: {
    fitnesstracker33f5545533f55455: {
      AppClientID: 'string';
      AppClientIDWeb: 'string';
      IdentityPoolId: 'string';
      IdentityPoolName: 'string';
      UserPoolArn: 'string';
      UserPoolId: 'string';
      UserPoolName: 'string';
    };
    userPoolGroups: {
      AdminGroupRole: 'string';
    };
  };
  function: {
    admin: {
      Arn: 'string';
      LambdaExecutionRole: 'string';
      LambdaExecutionRoleArn: 'string';
      Name: 'string';
      Region: 'string';
    };
    fitnesstracker33f5545533f55455PreSignup: {
      Arn: 'string';
      LambdaExecutionRole: 'string';
      LambdaExecutionRoleArn: 'string';
      Name: 'string';
      Region: 'string';
    };
    lognutrition: {
      Arn: 'string';
      LambdaExecutionRole: 'string';
      LambdaExecutionRoleArn: 'string';
      Name: 'string';
      Region: 'string';
    };
  };
};
