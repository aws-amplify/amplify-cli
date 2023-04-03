"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideCrud = void 0;
const constants_1 = require("../utils/constants");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const dynamoDBWalkthrough_1 = require("../utils/dynamoDBWalkthrough");
const destFileMapper_1 = require("../utils/destFileMapper");
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda/crud');
async function provideCrud(context) {
    const dynamoResource = await (0, dynamoDBWalkthrough_1.askDynamoDBQuestions)(context);
    const tableParameters = await (0, dynamoDBWalkthrough_1.getTableParameters)(dynamoResource);
    Object.assign(dynamoResource, { category: 'storage' }, { tableDefinition: { ...tableParameters } });
    const files = fs_extra_1.default.readdirSync(pathToTemplateFiles);
    return {
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            parameters: {
                path: '/item',
                expressPath: '/item',
                database: dynamoResource,
            },
            defaultEditorFile: path_1.default.join('src', 'app.js'),
            destMap: (0, destFileMapper_1.getDstMap)(files),
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