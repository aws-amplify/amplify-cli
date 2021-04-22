export class NotImplementedError extends Error {}
export class ResourceAlreadyExistsError extends Error {}
export class ResourceDoesNotExistError extends Error {}
export class ResourceCredentialsNotFoundError extends Error {}
export class UnknownResourceTypeError extends Error {}
export class UnknownArgumentError extends Error {}
export class EnvironmentDoesNotExistError extends Error {}
export class MissingParametersError extends Error {}
export class NonEmptyDirectoryError extends Error {}
export class InvalidEnvironmentNameError extends Error {}
export class InvalidSubCommandError extends Error {}
export class FrontendBuildError extends Error {}
export class TeamProviderInfoMigrateError extends Error {}
export class AppNotFoundError extends Error {}
export class AppAlreadyDeployedError extends Error {}
export class SchemaDoesNotExistError extends Error {}
export class AngularConfigNotFoundError extends Error {}
export class AppIdMismatchError extends Error {}
export class UnrecognizedFrameworkError extends Error {}
export class NotInitializedError extends Error {
  public constructor() {
    super();
    this.name = 'NotInitializedError';
    this.message = `
      No Amplify backend project files detected within this folder. Either initialize a new Amplify project or pull an existing project.
      - "amplify init" to initialize a new Amplify project
      - "amplify pull <app-id>" to pull your existing Amplify project. Find the <app-id> in the AWS Console or Amplify Admin UI.
        `;
    this.stack = undefined;
  }
}
