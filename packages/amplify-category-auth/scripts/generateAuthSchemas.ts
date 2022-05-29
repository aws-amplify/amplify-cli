import { AmplifySupportedService, CLIInputSchemaGenerator, TypeDef } from 'amplify-cli-core';

const CognitoAuthTypeDef: TypeDef = {
  typeName: 'CognitoCLIInputs',
  service: AmplifySupportedService.COGNITO,
};

// Defines the type names and the paths to the TS files that define them
const authCategoryTypeDefs: TypeDef[] = [CognitoAuthTypeDef];

const schemaGenerator = new CLIInputSchemaGenerator(authCategoryTypeDefs);
schemaGenerator.generateJSONSchemas(); //convert CLI input data into json schemas.
