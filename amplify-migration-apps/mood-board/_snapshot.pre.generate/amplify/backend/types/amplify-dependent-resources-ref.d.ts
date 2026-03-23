export type AmplifyDependentResourcesAttributes = {
  "analytics": {
    "moodboardKinesis": {
      "kinesisStreamArn": "string",
      "kinesisStreamId": "string",
      "kinesisStreamShardCount": "string"
    }
  },
  "api": {
    "moodboard": {
      "GraphQLAPIEndpointOutput": "string",
      "GraphQLAPIIdOutput": "string",
      "GraphQLAPIKeyOutput": "string"
    }
  },
  "auth": {
    "moodboard759ae00a": {
      "AppClientID": "string",
      "AppClientIDWeb": "string",
      "IdentityPoolId": "string",
      "IdentityPoolName": "string",
      "UserPoolArn": "string",
      "UserPoolId": "string",
      "UserPoolName": "string"
    }
  },
  "function": {
    "moodboardGetRandomEmoji": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "moodboardKinesisReader": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    }
  },
  "storage": {
    "moodboardStorage": {
      "BucketName": "string",
      "Region": "string"
    }
  }
}