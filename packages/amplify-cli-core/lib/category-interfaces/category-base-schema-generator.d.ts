import Ajv from 'ajv';
import { $TSContext } from '..';
export type TypeDef = {
    typeName: string;
    service: string;
};
export declare class CLIInputSchemaGenerator {
    TYPES_SRC_ROOT: string;
    SCHEMA_FILES_ROOT: string;
    OVERWRITE_SCHEMA_FLAG: string;
    private serviceTypeDefs;
    private getSchemaFileNameForType;
    private getSvcFileAbsolutePath;
    private getTypesSrcRootForSvc;
    private printWarningSchemaFileExists;
    private printSuccessSchemaFileWritten;
    private printGeneratingSchemaMessage;
    constructor(typeDefs: TypeDef[]);
    generateJSONSchemas(): string[];
}
export declare class CLIInputSchemaValidator {
    _context: $TSContext;
    _category: string;
    _service: string;
    _schemaFileName: string;
    _ajv: Ajv.Ajv;
    constructor(context: $TSContext, service: string, category: string, schemaFileName: string);
    getUserInputSchema(): Promise<any>;
    validateInput(userInput: string): Promise<boolean>;
}
//# sourceMappingURL=category-base-schema-generator.d.ts.map