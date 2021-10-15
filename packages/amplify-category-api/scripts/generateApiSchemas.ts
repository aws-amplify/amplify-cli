import * as SchemaGenerator from 'amplify-cli-core';

type TypeDef = SchemaGenerator.TypeDef;

const AppsyncApiTypeDef: TypeDef = {
  typeName: 'AppsyncCLIInputs',
  service: 'appsync',
};

// Defines the type names and the paths to the TS files that define them
const appsyncApiCategoryTypeDefs: TypeDef[] = [AppsyncApiTypeDef];

const schemaGenerator = new SchemaGenerator.CLIInputSchemaGenerator(appsyncApiCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); //convert CLI input data into json schemas.
