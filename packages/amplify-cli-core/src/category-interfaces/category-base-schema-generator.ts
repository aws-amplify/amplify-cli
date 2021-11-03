/**
 * Utility base classes for all categories : CLIInputSchemaGenerator
 * Generates JSON-schema from Typescript structures.The generated schemas
 * can be used for run-time validation of Walkthrough/Headless structures.
 */
import { getProgramFromFiles, buildGenerator, PartialArgs } from 'typescript-json-schema';
import * as fs from 'fs-extra';
import * as path from 'path';
import Ajv from 'ajv';
import { printer } from 'amplify-prompts';
import { $TSAny, JSONUtilities } from '..';

// Interface types are expected to be exported as "typeName" in the file
export type TypeDef = {
  typeName: string;
  service: string;
};

/**
 * Normalize Service Name for use in filepaths
 * e.g Convert DynamoDB to dynamoDB , S3 to s3 as filename prefix
 * @param svcName
 * @returns normalizedSvcName
 */
function normalizeServiceToFilePrefix(serviceName: string): string {
  serviceName = serviceName.replace(' ', '');
  return `${serviceName[0].toLowerCase()}${serviceName.slice(1)}`;
}

export class CLIInputSchemaGenerator {
  // Paths are relative to the package root
  TYPES_SRC_ROOT = path.join('.', 'src', 'provider-utils', 'awscloudformation', 'service-walkthrough-types');
  SCHEMA_FILES_ROOT = path.join('.', 'resources', 'schemas');
  OVERWRITE_SCHEMA_FLAG = '--overwrite';

  private serviceTypeDefs: TypeDef[];

  private getSchemaFileNameForType(typeName: string): string {
    return `${typeName}.schema.json`;
  }

  private getSvcFileAbsolutePath(normalizedSvcName: string): string {
    return path.resolve(this.getTypesSrcRootForSvc(normalizedSvcName));
  }

  private getTypesSrcRootForSvc(normalizedSvcName: string): string {
    return path.join(this.TYPES_SRC_ROOT, `${normalizedSvcName}-user-input-types.ts`);
  }

  private printWarningSchemaFileExists() {
    printer.info('The interface version must be bumped after any changes.');
    printer.info(`Use the ${this.OVERWRITE_SCHEMA_FLAG} flag to overwrite existing versions`);
    printer.info('Skipping this schema');
  }

  private printSuccessSchemaFileWritten(schemaFilePath: string, typeName: string) {
    printer.info(`Schema written for type ${typeName}.`);
    printer.info(`Output Path: ${schemaFilePath}`);
  }

  private printGeneratingSchemaMessage(svcAbsoluteFilePath: string, serviceName: string) {
    printer.info(`Generating Schema for ${serviceName}`);
    printer.info(`Input Path: ${svcAbsoluteFilePath}`);
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
      const normalizedServiceName = normalizeServiceToFilePrefix(typeDef.service);
      //get absolute file path to the user-input types for the given service
      const svcAbsoluteFilePath = this.getSvcFileAbsolutePath(normalizedServiceName);
      this.printGeneratingSchemaMessage(svcAbsoluteFilePath, typeDef.service);
      //generate json-schema from the input-types
      const program = getProgramFromFiles([svcAbsoluteFilePath]);
      const schemaGenerator = buildGenerator(program, settings);
      const typeSchema = schemaGenerator?.getSchemaForSymbol(typeDef.typeName);
      //save json-schema file for the input-types. (used to validate cli-inputs.json)
      const outputSchemaFilePath = path.resolve(
        path.join(this.SCHEMA_FILES_ROOT, normalizedServiceName, this.getSchemaFileNameForType(typeDef.typeName)),
      );
      if (!force && fs.existsSync(outputSchemaFilePath)) {
        this.printWarningSchemaFileExists();
        return generatedFilePaths;
      }
      fs.ensureFileSync(outputSchemaFilePath);
      JSONUtilities.writeJson(outputSchemaFilePath, typeSchema);
      //print success status to the terminal
      this.printSuccessSchemaFileWritten(outputSchemaFilePath, typeDef.typeName);
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
    this._service = normalizeServiceToFilePrefix(service);
    this._schemaFileName = schemaFileName;
    this._ajv = new Ajv();
  }

  async getUserInputSchema() {
    try {
      return await import(generateSchemaPath(this._category, this._service, this._schemaFileName));
    } catch (ex) {
      throw new Error(`Schema defination doesnt exist : ${generateSchemaPath(this._category, this._service, this._schemaFileName)}`);
    }
  }

  async validateInput(userInput: string): Promise<boolean> {
    const userInputSchema = await this.getUserInputSchema();
    if (userInputSchema.dependencySchemas) {
      userInputSchema.dependencySchemas.reduce((acc: { addSchema: (arg0: $TSAny) => $TSAny }, it: $TSAny) => acc.addSchema(it), this._ajv);
    }
    const validate = this._ajv.compile(userInputSchema);
    const input = JSONUtilities.parse(userInput);
    if (!validate(input) as boolean) {
      throw new Error(
        `Data did not validate against the supplied schema. Underlying errors were ${JSONUtilities.stringify(validate.errors)}`,
      );
    }
    return true;
  }
}

const generateSchemaPath = (category: string, service: string, schemaFileName: string): string => {
  return path.join(`@aws-amplify/amplify-category-${category}`, 'resources', 'schemas', `${service}`, `${schemaFileName}.schema.json`);
};
