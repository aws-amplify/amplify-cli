export const categoryName = 'storage';

export enum ServiceName {
  S3 = 'S3',
  DynamoDB = 'DynamoDB',
}

// keep in sync with ServiceName in amplify-category-function, but probably it will not change
export const FunctionServiceNameLambdaFunction = 'Lambda';

export const storageParamsFilename = 'storage-params.json';
export const templateFilenameMap = {
  [ServiceName.S3]: 's3-cloudformation-template.json.ejs',
  [ServiceName.DynamoDB]: 'dynamoDb-cloudformation-template.json.ejs',
};
