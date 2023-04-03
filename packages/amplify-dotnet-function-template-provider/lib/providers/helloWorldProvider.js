"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideHelloWorld = void 0;
const constants_1 = require("../utils/constants");
const destFileMapper_1 = require("../utils/destFileMapper");
const path_1 = __importDefault(require("path"));
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda');
async function provideHelloWorld(request) {
    const files = [
        ...constants_1.commonFiles,
        'HelloWorld/aws-lambda-tools-defaults.json.ejs',
        'HelloWorld/Function.csproj.ejs',
        'HelloWorld/FunctionHandler.cs.ejs',
        'HelloWorld/event.json',
    ];
    const handlerSource = path_1.default.join('src', `${request.contributionContext.functionName}.cs`);
    return {
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            defaultEditorFile: handlerSource,
            destMap: {
                ...(0, destFileMapper_1.getDstMap)(constants_1.commonFiles),
                'HelloWorld/aws-lambda-tools-defaults.json.ejs': path_1.default.join('src', 'aws-lambda-tools-defaults.json'),
                'HelloWorld/Function.csproj.ejs': path_1.default.join('src', `${request.contributionContext.resourceName}.csproj`),
                'HelloWorld/FunctionHandler.cs.ejs': handlerSource,
                'HelloWorld/event.json': path_1.default.join('src', 'event.json'),
            },
        },
    };
}
exports.provideHelloWorld = provideHelloWorld;
//# sourceMappingURL=helloWorldProvider.js.map