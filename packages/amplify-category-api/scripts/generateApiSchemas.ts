import * as SchemaGenerator from 'amplify-cli-core';

type TypeDef = SchemaGenerator.TypeDef;

const ApigwTypeDef: TypeDef = {
  typeName: 'APIGatewayCLIInputs',
  service: 'API Gateway',
};

// Defines the type names and the paths to the TS files that define them
const apigwCategoryTypeDefs: TypeDef[] = [ApigwTypeDef];

const schemaGenerator = new SchemaGenerator.CLIInputSchemaGenerator(apigwCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); // convert CLI input data into json schemas.
