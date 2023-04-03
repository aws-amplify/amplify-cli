"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideServerless = void 0;
const constants_1 = require("../utils/constants");
const destFileMapper_1 = require("../utils/destFileMapper");
const path_1 = __importDefault(require("path"));
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda');
function provideServerless(request) {
    const files = [
        ...constants_1.commonFiles,
        'Serverless/aws-lambda-tools-defaults.json.ejs',
        'Serverless/Function.csproj.ejs',
        'Serverless/FunctionHandler.cs.ejs',
        'Serverless/event.json.ejs',
    ];
    const handlerSource = path_1.default.join('src', `${request.contributionContext.functionName}.cs`);
    return Promise.resolve({
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            parameters: {
                path: '/item',
                expressPath: '/item',
            },
            defaultEditorFile: handlerSource,
            destMap: {
                ...(0, destFileMapper_1.getDstMap)(constants_1.commonFiles),
                'Serverless/aws-lambda-tools-defaults.json.ejs': path_1.default.join('src', 'aws-lambda-tools-defaults.json'),
                'Serverless/Function.csproj.ejs': path_1.default.join('src', `${request.contributionContext.resourceName}.csproj`),
                'Serverless/FunctionHandler.cs.ejs': handlerSource,
                'Serverless/event.json.ejs': path_1.default.join('src', 'event.json'),
            },
        },
    });
}
exports.provideServerless = provideServerless;
//# sourceMappingURL=serverlessProvider.js.map