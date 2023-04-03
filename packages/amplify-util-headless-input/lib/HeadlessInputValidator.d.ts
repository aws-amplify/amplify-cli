import { JSONSchema7 } from 'json-schema';
export declare class HeadlessInputValidator {
    private readonly schemaSupplier;
    private readonly versionUpgradePipeline;
    constructor(schemaSupplier: VersionedSchemaSupplier, versionUpgradePipeline: VersionUpgradePipeline);
    validate<T>(raw: string): Promise<T>;
    private checkAgainstSchema;
    private upgradeInput;
}
export type VersionedSchemaSupplier = (version: number) => Promise<{
    readonly rootSchema: JSONSchema7;
    readonly dependencySchemas?: JSONSchema7[];
} | void>;
export type VersionUpgradePipeline = (version: number) => ((...args: unknown[]) => unknown)[];
//# sourceMappingURL=HeadlessInputValidator.d.ts.map