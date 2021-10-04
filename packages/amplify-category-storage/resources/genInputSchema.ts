import { TypeDef, CLIInputSchemaGenerator } from 'amplify-cli-core';

//ResourceProvider TypeDefs
const DDBStorageTypeDef: TypeDef = {
  typeName: 'DynamoDBCLIInputs',
  service: 'DynamoDB',
};
const S3StorageTypeDef: TypeDef = {
  typeName: 'S3UserInputs',
  service: 'S3',
};

// Defines the type names and the paths to the TS files that define them
const storageCategoryTypeDefs: TypeDef[] = [DDBStorageTypeDef];

const schemaGenerator = new CLIInputSchemaGenerator(storageCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); //convert CLI input data into json schemas.
