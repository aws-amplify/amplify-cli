"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIInputSchemaValidator = exports.CLIInputSchemaGenerator = void 0;
const typescript_json_schema_1 = require("typescript-json-schema");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const ajv_1 = __importDefault(require("ajv"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const __1 = require("..");
function normalizeServiceToFilePrefix(serviceName) {
    serviceName = serviceName.replace(' ', '');
    return `${serviceName[0].toLowerCase()}${serviceName.slice(1)}`;
}
class CLIInputSchemaGenerator {
    getSchemaFileNameForType(typeName) {
        return `${typeName}.schema.json`;
    }
    getSvcFileAbsolutePath(normalizedSvcName) {
        return path.resolve(this.getTypesSrcRootForSvc(normalizedSvcName));
    }
    getTypesSrcRootForSvc(normalizedSvcName) {
        return path.join(this.TYPES_SRC_ROOT, `${normalizedSvcName}-user-input-types.ts`);
    }
    printWarningSchemaFileExists() {
        amplify_prompts_1.printer.info('The interface version must be bumped after any changes.');
        amplify_prompts_1.printer.info(`Use the ${this.OVERWRITE_SCHEMA_FLAG} flag to overwrite existing versions`);
        amplify_prompts_1.printer.info('Skipping this schema');
    }
    printSuccessSchemaFileWritten(schemaFilePath, typeName) {
        amplify_prompts_1.printer.info(`Schema written for type ${typeName}.`);
        amplify_prompts_1.printer.info(`Output Path: ${schemaFilePath}`);
    }
    printGeneratingSchemaMessage(svcAbsoluteFilePath, serviceName) {
        amplify_prompts_1.printer.info(`Generating Schema for ${serviceName}`);
        amplify_prompts_1.printer.info(`Input Path: ${svcAbsoluteFilePath}`);
    }
    constructor(typeDefs) {
        this.TYPES_SRC_ROOT = path.join('.', 'src', 'provider-utils', 'awscloudformation', 'service-walkthrough-types');
        this.SCHEMA_FILES_ROOT = path.join('.', 'resources', 'schemas');
        this.OVERWRITE_SCHEMA_FLAG = '--overwrite';
        this.serviceTypeDefs = typeDefs;
    }
    generateJSONSchemas() {
        const force = process.argv.includes(this.OVERWRITE_SCHEMA_FLAG);
        const generatedFilePaths = [];
        const settings = {
            required: true,
        };
        for (const typeDef of this.serviceTypeDefs) {
            const normalizedServiceName = normalizeServiceToFilePrefix(typeDef.service);
            const svcAbsoluteFilePath = this.getSvcFileAbsolutePath(normalizedServiceName);
            this.printGeneratingSchemaMessage(svcAbsoluteFilePath, typeDef.service);
            const program = (0, typescript_json_schema_1.getProgramFromFiles)([svcAbsoluteFilePath]);
            const schemaGenerator = (0, typescript_json_schema_1.buildGenerator)(program, settings);
            const typeSchema = schemaGenerator === null || schemaGenerator === void 0 ? void 0 : schemaGenerator.getSchemaForSymbol(typeDef.typeName);
            const outputSchemaFilePath = path.resolve(path.join(this.SCHEMA_FILES_ROOT, normalizedServiceName, this.getSchemaFileNameForType(typeDef.typeName)));
            if (!force && fs.existsSync(outputSchemaFilePath)) {
                this.printWarningSchemaFileExists();
                return generatedFilePaths;
            }
            fs.ensureFileSync(outputSchemaFilePath);
            __1.JSONUtilities.writeJson(outputSchemaFilePath, typeSchema);
            this.printSuccessSchemaFileWritten(outputSchemaFilePath, typeDef.typeName);
            generatedFilePaths.push(outputSchemaFilePath);
        }
        return generatedFilePaths;
    }
}
exports.CLIInputSchemaGenerator = CLIInputSchemaGenerator;
class CLIInputSchemaValidator {
    constructor(context, service, category, schemaFileName) {
        this._context = context;
        this._category = category;
        this._service = normalizeServiceToFilePrefix(service);
        this._schemaFileName = schemaFileName;
        this._ajv = new ajv_1.default();
    }
    async getUserInputSchema() {
        var _a;
        try {
            return await (_a = generateSchemaPath(this._context, this._category, this._service, this._schemaFileName), Promise.resolve().then(() => __importStar(require(_a))));
        }
        catch (_b) {
            throw new Error(`Schema definition doesn't exist: ${generateSchemaPath(this._context, this._category, this._service, this._schemaFileName)}`);
        }
    }
    async validateInput(userInput) {
        const userInputSchema = await this.getUserInputSchema();
        if (userInputSchema.dependencySchemas) {
            userInputSchema.dependencySchemas.reduce((acc, it) => acc.addSchema(it), this._ajv);
        }
        const validate = this._ajv.compile(userInputSchema);
        const input = __1.JSONUtilities.parse(userInput);
        if (!validate(input)) {
            throw new Error(`Data did not validate against the supplied schema. Underlying errors were ${__1.JSONUtilities.stringify(validate.errors)}`);
        }
        return true;
    }
}
exports.CLIInputSchemaValidator = CLIInputSchemaValidator;
const generateSchemaPath = (context, category, service, schemaFileName) => {
    const pluginInfo = context.amplify.getCategoryPluginInfo(context, category);
    return path.join(pluginInfo.packageLocation, 'resources', 'schemas', `${service}`, `${schemaFileName}.schema.json`);
};
//# sourceMappingURL=category-base-schema-generator.js.map