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
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCFNTemplate = exports.CFNTemplateFormat = exports.readCFNTemplate = void 0;
const fs = __importStar(require("fs-extra"));
const yaml = __importStar(require("js-yaml"));
const path = __importStar(require("path"));
const jsonUtilities_1 = require("./jsonUtilities");
const defaultReadCFNTemplateOptions = { throwIfNotExist: true };
function readCFNTemplate(filePath, options = defaultReadCFNTemplateOptions) {
    options = { ...defaultReadCFNTemplateOptions, ...options };
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile) {
        if (options.throwIfNotExist === false) {
            return undefined;
        }
        throw new Error(`No CloudFormation template found at ${filePath}`);
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const isJson = isJsonFileContent(fileContent);
    const cfnTemplate = isJson ? jsonUtilities_1.JSONUtilities.parse(fileContent) : yaml.load(fileContent, { schema: CF_SCHEMA });
    const templateFormat = isJson ? CFNTemplateFormat.JSON : CFNTemplateFormat.YAML;
    return { templateFormat, cfnTemplate };
}
exports.readCFNTemplate = readCFNTemplate;
var CFNTemplateFormat;
(function (CFNTemplateFormat) {
    CFNTemplateFormat["JSON"] = "json";
    CFNTemplateFormat["YAML"] = "yaml";
})(CFNTemplateFormat = exports.CFNTemplateFormat || (exports.CFNTemplateFormat = {}));
const writeCFNTemplateDefaultOptions = {
    templateFormat: CFNTemplateFormat.JSON,
    minify: false,
};
const writeCFNTemplate = async (template, filePath, options) => {
    const mergedOptions = { ...writeCFNTemplateDefaultOptions, ...options };
    let serializedTemplate;
    switch (mergedOptions.templateFormat) {
        case CFNTemplateFormat.JSON:
            serializedTemplate = jsonUtilities_1.JSONUtilities.stringify(template, { minify: mergedOptions.minify });
            break;
        case CFNTemplateFormat.YAML:
            serializedTemplate = yaml.dump(template);
            break;
        default:
            throw new Error(`Unexpected CFN template format ${mergedOptions.templateFormat}`);
    }
    await fs.ensureDir(path.parse(filePath).dir);
    return fs.writeFileSync(filePath, serializedTemplate);
};
exports.writeCFNTemplate = writeCFNTemplate;
const CF_SCHEMA = yaml.JSON_SCHEMA.extend([
    new yaml.Type('!Base64', {
        kind: 'scalar',
        construct(data) {
            return { 'Fn::Base64': data };
        },
    }),
    new yaml.Type('!Base64', {
        kind: 'mapping',
        construct(data) {
            return { 'Fn::Base64': data };
        },
    }),
    new yaml.Type('!Cidr', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Cidr': data };
        },
    }),
    new yaml.Type('!Cidr', {
        kind: 'mapping',
        construct(data) {
            return { 'Fn::Cidr': data };
        },
    }),
    new yaml.Type('!And', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::And': data };
        },
    }),
    new yaml.Type('!Equals', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Equals': data };
        },
    }),
    new yaml.Type('!If', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::If': data };
        },
    }),
    new yaml.Type('!Not', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Not': data };
        },
    }),
    new yaml.Type('!Or', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Or': data };
        },
    }),
    new yaml.Type('!Condition', {
        kind: 'scalar',
        construct(data) {
            return { Condition: data };
        },
    }),
    new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::FindInMap': data };
        },
    }),
    new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct(data) {
            if (Array.isArray(data)) {
                return {
                    'Fn::GetAtt': data,
                };
            }
            const firstPeriodIdx = data.indexOf('.');
            return {
                'Fn::GetAtt': [data.slice(0, firstPeriodIdx), data.slice(firstPeriodIdx + 1)],
            };
        },
    }),
    new yaml.Type('!GetAtt', {
        kind: 'sequence',
        construct(data) {
            if (Array.isArray(data)) {
                return {
                    'Fn::GetAtt': data,
                };
            }
            const firstPeriodIdx = data.indexOf('.');
            return {
                'Fn::GetAtt': [data.slice(0, firstPeriodIdx), data.slice(firstPeriodIdx + 1)],
            };
        },
    }),
    new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct(data) {
            return { 'Fn::GetAZs': data };
        },
    }),
    new yaml.Type('!GetAZs', {
        kind: 'mapping',
        construct(data) {
            return { 'Fn::GetAZs': data };
        },
    }),
    new yaml.Type('!ImportValue', {
        kind: 'scalar',
        construct(data) {
            return { 'Fn::ImportValue': data };
        },
    }),
    new yaml.Type('!ImportValue', {
        kind: 'mapping',
        construct(data) {
            return { 'Fn::ImportValue': data };
        },
    }),
    new yaml.Type('!Join', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Join': data };
        },
    }),
    new yaml.Type('!Select', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Select': data };
        },
    }),
    new yaml.Type('!Split', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Split': data };
        },
    }),
    new yaml.Type('!Sub', {
        kind: 'scalar',
        construct(data) {
            return { 'Fn::Sub': data };
        },
    }),
    new yaml.Type('!Sub', {
        kind: 'sequence',
        construct(data) {
            return { 'Fn::Sub': data };
        },
    }),
    new yaml.Type('!Transform', {
        kind: 'mapping',
        construct(data) {
            return { 'Fn::Transform': data };
        },
    }),
    new yaml.Type('!Ref', {
        kind: 'scalar',
        construct(data) {
            return { Ref: data };
        },
    }),
]);
const isJsonFileContent = (fileContent) => (fileContent === null || fileContent === void 0 ? void 0 : fileContent.trim()[0]) === '{';
//# sourceMappingURL=cfnUtilities.js.map