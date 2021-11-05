import path from 'path';

export const provider = 'awscloudformation';
export const parametersFileName = 'api-params.json';
export const cfnParametersFilename = 'parameters.json';
export const gqlSchemaFilename = 'schema.graphql';

export const rootAssetDir = path.resolve(path.join(__dirname, '../../../resources/awscloudformation'));
