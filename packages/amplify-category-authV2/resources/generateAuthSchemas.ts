import { getProgramFromFiles, buildGenerator, PartialArgs, Definition } from 'typescript-json-schema';
import fs from 'fs-extra';
import path from 'path';

// paths are relative to the package root
const typesSourceRoot = './resources/service-walkthrough-types/cognito';
const schemaFilesRoot = './resources/schemas';

// defines the type names and the paths to the TS files that define them
const typeDefs: TypeDef[] = [
  {
    typeName: 'ServiceQuestionsResult',
    service: 'cognito',
    relativeSourcePaths: ['index.ts'],
  },
];

const schemaFileName = (typeName: string) => `${typeName}.schema.json`;
const forceFlag = '--overwrite';
const force = process.argv.includes(forceFlag);

// schema generation settings. see https://www.npmjs.com/package/typescript-json-schema#command-line
const settings: PartialArgs = {
  required: true,
};

typeDefs.forEach(typeDef => {
  const files = typeDef.relativeSourcePaths.map(p => path.resolve(path.join(typesSourceRoot, p)));
  const typeSchema = buildGenerator(getProgramFromFiles(files), settings)!.getSchemaForSymbol(typeDef.typeName);
  const schemaFilePath = path.resolve(path.join(schemaFilesRoot, typeDef.service, schemaFileName(typeDef.typeName)));
  if (!force && fs.existsSync(schemaFilePath)) {
    console.info('The interface version must be bumped after any changes.');
    console.info(`Use the ${forceFlag} flag to overwrite existing versions`);
    console.info('Skipping this schema');
    return;
  }
  fs.ensureFileSync(schemaFilePath);
  fs.writeFileSync(schemaFilePath, JSON.stringify(typeSchema, undefined, 4));
  console.log(`Schema written for type ${typeDef.typeName}.`);
});

// Interface types are expected to be exported as "typeName" in the file
type TypeDef = {
  typeName: string;
  relativeSourcePaths: string[];
  service: string;
};
