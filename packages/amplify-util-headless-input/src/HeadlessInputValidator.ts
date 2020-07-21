import Ajv from 'ajv';
import { JSONSchema7 } from 'json-schema';

/**
 * Validates input data against the provided JSON-schemas and performs version upgrades as specified by the versionUpgradePipeline
 */
export class HeadlessInputValidator {
  private readonly schemaSupplier: VersionedSchemaSupplier;
  private readonly versionUpgradePipeline: VersionUpgradePipeline;

  constructor(schemaSupplier: VersionedSchemaSupplier, versionUpgradePipeline: VersionUpgradePipeline) {
    this.schemaSupplier = schemaSupplier;
    this.versionUpgradePipeline = versionUpgradePipeline;
  }

  /**
   * Returns an object of type T if the raw input is able to be parsed, validated and upgraded (if needed) to type T.
   * Otherwise thows an error
   * @param raw the raw headless input
   */
  async validate<T>(raw: string): Promise<T> {
    const data = JSON.parse(raw);
    const version = await this.checkAgainstSchema(data);
    return this.upgradeInput<T>(data, version);
  }

  private async checkAgainstSchema(data: any): Promise<number> {
    if (!data || !data.version || typeof data.version !== 'number') {
      throw new Error('data does not have a top level "version" field');
    }
    const version = data.version;
    const schema = await this.schemaSupplier(version);
    if (!schema) {
      throw new Error(`No schema found for version ${version}`);
    }
    const ajv = new Ajv();
    if (schema.dependencySchemas) {
      schema.dependencySchemas.reduce((acc, it) => acc.addSchema(it), ajv);
    }
    const validator = ajv.compile(schema.rootSchema);
    if (!validator(data) as boolean) {
      throw new Error(`Data did not validate against the supplied schema. Underlying errors were ${JSON.stringify(validator.errors)}`);
    }
    return version;
  }

  /**
   * Upgraded the input data from the version specified to the latest version
   * This function assumes that the given versionUpgradePipeline can be composed and the final output will be an object of type T
   * @param data the input data
   * @param version the input data version
   */
  private upgradeInput<T>(data: any, version: number): T {
    return this.versionUpgradePipeline(version).reduce((output: any, transform) => transform(output), data) as T;
  }
}

/**
 * Function that takes a version number and returns a root schema and any dependency schemas for that schema version
 */
export type VersionedSchemaSupplier = (
  version: number,
) => Promise<{
  readonly rootSchema: JSONSchema7;
  readonly dependencySchemas?: JSONSchema7[];
} | void>;

/**
 * Function that takes a version number and returns an array of functions that can be composed to translate a payload of the given version into the latest version of the schema
 */
export type VersionUpgradePipeline = (version: number) => Function[];
