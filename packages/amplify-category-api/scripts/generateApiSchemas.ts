import * as SchemaGenerator from 'amplify-cli-core';

type TypeDef = SchemaGenerator.TypeDef;

// const ApigwTypeDef: TypeDef = {
//   typeName: 'APIGatewayCLIInputs',
//   service: 'API Gateway',
// };
const AppsyncApiTypeDef: TypeDef = {
  typeName: 'AppsyncCLIInputs',
  service: 'appsync',
};

// Defines the type names and the paths to the TS files that define them
const apiCategoryTypeDefs: TypeDef[] = [AppsyncApiTypeDef];

const schemaGenerator = new SchemaGenerator.CLIInputSchemaGenerator(apiCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); // convert CLI input data into json schemas.
