import { getProgramFromFiles, buildGenerator, PartialArgs } from 'typescript-json-schema';
import fs from 'fs-extra';
import path from 'path';

// Interface types are expected to be exported as "typeName" in the file
type TypeDef = {
  typeName: string;
  relativeSourcePaths: string[];
  service: string;
};

class CLIInputSchemaGenerator {
  // Paths are relative to the package root
  TYPES_SRC_ROOT = './resources/service-walkthrough-types/';
  SCHEMA_FILES_ROOT = './resources/schemas';
  OVERWRITE_SCHEMA_FLAG = '--overwrite';

  private serviceTypeDefs: TypeDef[];

  private getSchemaFileNameForType(typeName: string) {
    return `${typeName}.schema.json`;
  }

  private getTypesSrcRootForSvc(svcName: string) {
    return `${this.TYPES_SRC_ROOT}/${svcName}`;
  }

  private getSvcFileAbsolutePath(svcName: string, relativeSrcPath: string) {
    return path.resolve(path.join(this.getTypesSrcRootForSvc(svcName), relativeSrcPath));
  }

  private printWarningSchemaFileExists() {
    console.info('The interface version must be bumped after any changes.');
    console.info(`Use the ${this.OVERWRITE_SCHEMA_FLAG} flag to overwrite existing versions`);
    console.info('Skipping this schema');
  }

  private printSuccessSchemaFileWritten(typeName: string) {
    console.log(`Schema written for type ${typeName}.`);
  }

  constructor(typeDefs: TypeDef[]) {
    this.serviceTypeDefs = typeDefs;
  }

  public generateSchemas() {
    const force = process.argv.includes(this.OVERWRITE_SCHEMA_FLAG);

    // schema generation settings. see https://www.npmjs.com/package/typescript-json-schema#command-line
    const settings: PartialArgs = {
      required: true,
    };

    for (const typeDef of this.serviceTypeDefs) {
      //get absolute file paths
      const files = typeDef.relativeSourcePaths.map(relativePath => this.getSvcFileAbsolutePath(typeDef.service, relativePath));
      const typeSchema = buildGenerator(getProgramFromFiles(files), settings)!.getSchemaForSymbol(typeDef.typeName);
      const schemaFilePath = path.resolve(
        path.join(this.SCHEMA_FILES_ROOT, typeDef.service, this.getSchemaFileNameForType(typeDef.typeName)),
      );
      if (!force && fs.existsSync(schemaFilePath)) {
        this.printWarningSchemaFileExists();
        return;
      }
      fs.ensureFileSync(schemaFilePath);
      fs.writeFileSync(schemaFilePath, JSON.stringify(typeSchema, undefined, 4));
      this.printSuccessSchemaFileWritten(typeDef.typeName);
    }
  }
}

// Defines the type names and the paths to the TS files that define them
const S3TypeDefs: TypeDef[] = [
  {
    typeName: 'ServiceQuestionsResult',
    service: 's3',
    relativeSourcePaths: ['index.ts'],
  },
];

const schemaGenerator = new CLIInputSchemaGenerator(S3TypeDefs);
schemaGenerator.generateSchemas(); //convert CLI input data into json schemas.
