import { AmplifyError } from './amplify-error';

/**
 * defines the project not initialized error class
 */
export class ProjectNotInitializedError extends AmplifyError {
  constructor() {
    super('ProjectNotInitializedError', {
      message: 'No Amplify backend project files detected within this folder.',
      resolution: `
Either initialize a new Amplify project or pull an existing project.
- "amplify init" to initialize a new Amplify project
- "amplify pull <app-id>" to pull your existing Amplify project. Find the <app-id> in the AWS Console or Amplify Admin UI.
`,
    });
  }
}
