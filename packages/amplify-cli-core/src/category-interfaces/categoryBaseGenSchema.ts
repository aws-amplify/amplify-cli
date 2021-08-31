/**
 * Utility base classes for all categories : CLIInputSchemaGenerator
 * Generates JSON-schema from Typescript structures.The generated schemas
 * can be used for run-time validation of Walkthrough/Headless structures.
 */
import { getProgramFromFiles, buildGenerator, PartialArgs } from 'typescript-json-schema';
import fs from 'fs-extra';
import path from 'path';
import Ajv from 'ajv';

// Interface types are expected to be exported as "typeName" in the file
export type TypeDef = {
  typeName: string;
  service: string;
};

export class CLIInputSchemaGenerator {
  // Paths are relative to the package root
  TYPES_SRC_ROOT = './src/provider-utils/awscloudformation/service-walkthrough-types/';
  SCHEMA_FILES_ROOT = './src/provider-utils/awscloudformation/schemas';
  OVERWRITE_SCHEMA_FLAG = '--overwrite';

  private serviceTypeDefs: TypeDef[];

  private getSchemaFileNameForType(typeName: string): string {
    return `${typeName}.schema.json`;
  }

  private getTypesSrcRootForSvc(svcName: string): string {
    return `${this.TYPES_SRC_ROOT}/${svcName}-user-input-types.ts`;
  }

  private getSvcFileAbsolutePath(svcName: string): string {
    return path.resolve(this.getTypesSrcRootForSvc(svcName));
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

  public generateJSONSchemas(): string[] {
    const force = process.argv.includes(this.OVERWRITE_SCHEMA_FLAG);
    const generatedFilePaths: string[] = [];

    // schema generation settings. see https://www.npmjs.com/package/typescript-json-schema#command-line
    const settings: PartialArgs = {
      required: true,
    };

    for (const typeDef of this.serviceTypeDefs) {
      //get absolute file path to the user-input types for the given service
      const svcAbsoluteFilePath = this.getSvcFileAbsolutePath(typeDef.service);
      console.log(svcAbsoluteFilePath);
      //generate json-schema from the input-types
      const typeSchema = buildGenerator(getProgramFromFiles([svcAbsoluteFilePath]), settings)!.getSchemaForSymbol(typeDef.typeName);
      //save json-schema file for the input-types. (used to validate cli-inputs.json)
      const outputSchemaFilePath = path.resolve(
        path.join(this.SCHEMA_FILES_ROOT, typeDef.service, this.getSchemaFileNameForType(typeDef.typeName)),
      );
      if (!force && fs.existsSync(outputSchemaFilePath)) {
        this.printWarningSchemaFileExists();
        return generatedFilePaths;
      }
      fs.ensureFileSync(outputSchemaFilePath);
      fs.writeFileSync(outputSchemaFilePath, JSON.stringify(typeSchema, undefined, 4));
      //print success status to the terminal
      this.printSuccessSchemaFileWritten(typeDef.typeName);
      generatedFilePaths.push(outputSchemaFilePath);
    }
    return generatedFilePaths;
  }
}

//Read Schema, Validate and return Typescript object.
export class CLIInputSchemaValidator {
  _category: string;
  _service: string;
  _schemaFileName: string;
  _ajv: Ajv.Ajv;

  constructor(service: string, category: string, schemaFileName: string) {
    this._category = category;
    this._service = service;
    this._schemaFileName = schemaFileName;
    this._ajv = new Ajv();
  }

  async getUserInputSchema() {
    try {
      return await import(`amplify-category-${this._category}/resources/schemas/${this._service}/${this._schemaFileName}.schema.json`);
    } catch (ex) {
      return; // resolve the promise with void if the schema does not exist
    }
  }

  async validateInput(userInput: string) {
    try {
      const userInputSchema = await this.getUserInputSchema();
      return this._ajv.validate(userInputSchema, userInput);
    } catch (ex) {
      return;
    }
  }
}
