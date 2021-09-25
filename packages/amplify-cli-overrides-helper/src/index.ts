import { printer } from 'amplify-prompts';

function getProjectInfo(): void {
  printer.info('Hello from the skeleton of get project info');
  return;
}

function addDependency(): void {
  printer.info('Hello from the skeleton of add dependency');
  return;
}

export { getProjectInfo, addDependency };
