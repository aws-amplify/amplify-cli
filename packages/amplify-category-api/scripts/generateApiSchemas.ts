import { AmplifySupportedService, CLIInputSchemaGenerator, TypeDef } from 'amplify-cli-core';

const AppsyncApiTypeDef: TypeDef = {
  typeName: 'AppSyncCLIInputs',
  service: AmplifySupportedService.APPSYNC,
};

const ApigwTypeDef: TypeDef = {
  typeName: 'APIGatewayCLIInputs',
  service: AmplifySupportedService.APIGW,
};

// Defines the type names and the paths to the TS files that define them
const apiCategoryTypeDefs: TypeDef[] = [AppsyncApiTypeDef, ApigwTypeDef];

const schemaGenerator = new CLIInputSchemaGenerator(apiCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); // convert CLI input data into json schemas.
