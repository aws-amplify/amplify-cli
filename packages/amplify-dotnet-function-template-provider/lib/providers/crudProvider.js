"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideCrud = void 0;
const constants_1 = require("../utils/constants");
const destFileMapper_1 = require("../utils/destFileMapper");
const path_1 = __importDefault(require("path"));
const dynamoDBWalkthrough_1 = require("../utils/dynamoDBWalkthrough");
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda');
async function provideCrud(request, context) {
    const dynamoResource = await (0, dynamoDBWalkthrough_1.askDynamoDBQuestions)(context);
    const tableParameters = await (0, dynamoDBWalkthrough_1.getTableParameters)(context, dynamoResource);
    Object.assign(dynamoResource, { category: 'storage' }, { tableDefinition: { ...tableParameters } });
    const files = [
        ...constants_1.commonFiles,
        'Crud/aws-lambda-tools-defaults.json.ejs',
        'Crud/Function.csproj.ejs',
        'Crud/FunctionHandler.cs.ejs',
        'Crud/event.json.ejs',
    ];
    const handlerSource = path_1.default.join('src', `${request.contributionContext.functionName}.cs`);
    return {
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            parameters: {
                path: '/items',
                expressPath: '/items',
                database: dynamoResource,
            },
            defaultEditorFile: handlerSource,
            destMap: {
                ...(0, destFileMapper_1.getDstMap)(constants_1.commonFiles),
                'Crud/aws-lambda-tools-defaults.json.ejs': path_1.default.join('src', 'aws-lambda-tools-defaults.json'),
                'Crud/Function.csproj.ejs': path_1.default.join('src', `${request.contributionContext.resourceName}.csproj`),
                'Crud/FunctionHandler.cs.ejs': handlerSource,
                'Crud/event.json.ejs': path_1.default.join('src', 'event.json'),
            },
        },
        dependsOn: [
            {
                category: 'storage',
                resourceName: dynamoResource.resourceName,
                attributes: ['Name', 'Arn'],
                attributeEnvMap: { Name: 'TABLE_NAME', Arn: 'TABLE_ARN' },
            },
        ],
    };
}
exports.provideCrud = provideCrud;
//# sourceMappingURL=crudProvider.js.map