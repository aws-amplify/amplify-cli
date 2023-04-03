"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideTrigger = void 0;
const constants_1 = require("../utils/constants");
const path_1 = __importDefault(require("path"));
const eventSourceWalkthrough_1 = require("../utils/eventSourceWalkthrough");
const pathToTemplateFiles = path_1.default.join(constants_1.templateRoot, 'lambda/trigger');
async function provideTrigger(context) {
    const eventSourceAnswers = await (0, eventSourceWalkthrough_1.askEventSourceQuestions)(context);
    const templateFile = eventSourceAnswers.triggerEventSourceMappings[0].functionTemplateName;
    const files = [templateFile, 'package.json.ejs', 'event.json'];
    return {
        triggerEventSourceMappings: eventSourceAnswers.triggerEventSourceMappings,
        dependsOn: eventSourceAnswers.dependsOn,
        functionTemplate: {
            sourceRoot: pathToTemplateFiles,
            sourceFiles: files,
            destMap: {
                [templateFile]: path_1.default.join('src', 'index.js'),
                'package.json.ejs': path_1.default.join('src', 'package.json'),
                'event.json': path_1.default.join('src', 'event.json'),
            },
            defaultEditorFile: path_1.default.join('src', 'index.js'),
        },
    };
}
exports.provideTrigger = provideTrigger;
//# sourceMappingURL=triggerProvider.js.map