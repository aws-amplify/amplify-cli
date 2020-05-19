import Ajv from 'ajv';

export class HeadlessInputValidator {
  private readonly schemaSupplier: VersionedSchemaSupplier;
  private readonly versionUpgradePipeline: VersionUpgradePipeline;

  constructor(schemaSupplier: VersionedSchemaSupplier, versionUpgradePipeline: VersionUpgradePipeline) {
    this.schemaSupplier = schemaSupplier;
    this.versionUpgradePipeline = versionUpgradePipeline;
  }

  public validate<T>(data: any): T {
    const version = this.checkAgainstSchema(data);
    return this.upgradeInput<T>(data, version);
  }

  private checkAgainstSchema(data: any): number {
    if (!data || !data.version || typeof data.version !== 'number') {
      throw new Error('data does not have a top level "version" field');
    }
    const version = data.version;
    const schema = this.schemaSupplier(version);
    const ajv = new Ajv();
    if (schema.dependencySchemas) {
      schema.dependencySchemas.reduce((acc, it) => acc.addSchema(it), ajv);
    }
    const validator = ajv.compile(schema.rootSchema);
    if (!validator(data) as boolean) {
      throw new Error(`Data did not validate against the supplied schema. Underlying errors were ${validator.errors}`);
    }
    return version;
  }

  private upgradeInput<T>(data: any, version: number): T {
    return this.versionUpgradePipeline(version)
      .reduce((output: any, transform) => transform(output), data) as T;
  }
}

export type VersionedSchemaSupplier = (version: number) => {
  readonly rootSchema: any,
  readonly dependencySchemas?: any[]
};

export type VersionUpgradePipeline = (version: number) => Function[];

export class VersionUpgradePipelineBuilder {
  private versionIndexMap: Map<number, number> = new Map();
  private transformationFunctions: Function[] = [];

  public withVersionIndexMap(map: Map<number, number>) {
    this.versionIndexMap = map;
    return this;
  }

  public withTransformationFunctions(functions: Function[]) {
    this.transformationFunctions = functions;
    return this;
  }

  public build(): VersionUpgradePipeline {
    return (version) => {
      return this.transformationFunctions.slice(this.versionIndexMap.get(version));
    }
  }
}