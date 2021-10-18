import { TypeDef, CLIInputSchemaGenerator, AmplifySupportedService } from 'amplify-cli-core';

//ResourceProvider TypeDefs
const DDBStorageTypeDef: TypeDef = {
  typeName: 'DynamoDBCLIInputs',
  service: AmplifySupportedService.DYNAMODB,
};
const S3StorageTypeDef: TypeDef = {
  typeName: 'S3UserInputs',
  service: AmplifySupportedService.S3,
};

// Defines the type names and the paths to the TS files that define them
const storageCategoryTypeDefs: TypeDef[] = [DDBStorageTypeDef, S3StorageTypeDef];

const schemaGenerator = new CLIInputSchemaGenerator(storageCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); //convert CLI input data into json schemas.
