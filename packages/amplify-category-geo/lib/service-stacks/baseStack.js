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
exports.BaseStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class BaseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, { synthesizer: new cdk.LegacyStackSynthesizer() });
        this.toCloudFormation = () => {
            const root = this.node.root;
            const assembly = root.synth();
            if (!this.nestedStackParent) {
                return assembly.getStackArtifact(this.artifactId).template;
            }
            const template = fs.readFileSync(path.join(assembly.directory, this.templateFile));
            return JSON.parse(template.toString('utf-8'));
        };
        this.parameters = new Map();
        this.regionMapping = new cdk.CfnMapping(this, 'RegionMapping', {
            mapping: props.RegionMapping,
        });
    }
    constructInputParameters(parameterNames) {
        const parametersMap = new Map();
        parameterNames.forEach((parameterName) => {
            const inputParameter = new cdk.CfnParameter(this, parameterName, { type: 'String' });
            parametersMap.set(parameterName, inputParameter);
        });
        return parametersMap;
    }
}
exports.BaseStack = BaseStack;
//# sourceMappingURL=baseStack.js.map