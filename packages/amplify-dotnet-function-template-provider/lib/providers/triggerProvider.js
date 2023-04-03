"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideTrigger = void 0;
const constants_1 = require("../utils/constants");
const destFileMapper_1 = require("../utils/destFileMapper");
const path_1 = __importDefault(require("path"));
const eventSourceWalkthrough_1 = require("../utils/eventSourceWalkthrough");
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda');
const templateFolder = 'Trigger';
async function provideTrigger(request, context) {
    const eventSourceAnswers = await (0, eventSourceWalkthrough_1.askEventSourceQuestions)(context);
    const templateFile = path_1.default.join(templateFolder, eventSourceAnswers.triggerEventSourceMappings[0].functionTemplateName);
    const handlerSource = path_1.default.join('src', `${request.contributionContext.functionName}.cs`);
    let eventFile;
    switch (eventSourceAnswers.triggerEventSourceMappings[0].functionTemplateType) {
        case 'kinesis':
            eventFile = path_1.default.join(templateFolder, 'event.kinesis.json');
            break;
        case 'dynamoDB':
            eventFile = path_1.default.join(templateFolder, 'event.dynamodb.json');
            break;
        default:
            throw new Error(`Unknown template type ${eventSourceAnswers.triggerEventSourceMappings[0].functionTemplateType}`);
    }
    const files = [...constants_1.commonFiles, templateFile, 'Trigger/aws-lambda-tools-defaults.json.ejs', 'Trigger/Function.csproj.ejs', eventFile];
    return {
        triggerEventSourceMappings: eventSourceAnswers.triggerEventSourceMappings,
        dependsOn: eventSourceAnswers.dependsOn,
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            destMap: {
                ...(0, destFileMapper_1.getDstMap)(constants_1.commonFiles),
                [templateFile]: handlerSource,
                'Trigger/aws-lambda-tools-defaults.json.ejs': path_1.default.join('src', 'aws-lambda-tools-defaults.json'),
                'Trigger/Function.csproj.ejs': path_1.default.join('src', `${request.contributionContext.resourceName}.csproj`),
                [eventFile]: path_1.default.join('src', 'event.json'),
            },
            defaultEditorFile: handlerSource,
        },
    };
}
exports.provideTrigger = provideTrigger;
//# sourceMappingURL=triggerProvider.js.map