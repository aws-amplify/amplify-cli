"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectNotInitializedError = void 0;
const amplify_error_1 = require("./amplify-error");
const projectNotInitializedError = () => new amplify_error_1.AmplifyError('ProjectNotInitializedError', {
    message: 'No Amplify backend project files detected within this folder.',
    resolution: `
Either initialize a new Amplify project or pull an existing project.
- "amplify init" to initialize a new Amplify project
- "amplify pull <app-id>" to pull your existing Amplify project. Find the <app-id> in the AWS Console or Amplify Studio.
`,
});
exports.projectNotInitializedError = projectNotInitializedError;
//# sourceMappingURL=project-not-initialized-error.js.map