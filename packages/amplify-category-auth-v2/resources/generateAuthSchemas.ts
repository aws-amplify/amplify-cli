import * as SchemaGenerator from 'amplify-cli-core';

type TypeDef = SchemaGenerator.TypeDef;

const CognitoAuthTypeDef: TypeDef = {
  typeName: 'CognitoCLIInputs',
  service: 'awsCognito',
};

// Defines the type names and the paths to the TS files that define them
const authCategoryTypeDefs: TypeDef[] = [CognitoAuthTypeDef];

const schemaGenerator = new SchemaGenerator.CLIInputSchemaGenerator(authCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); //convert CLI input data into json schemas.
