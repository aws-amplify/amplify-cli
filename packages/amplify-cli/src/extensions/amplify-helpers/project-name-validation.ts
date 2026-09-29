import { makeId } from './make-id';

export const validAlphanumericRegex = /^[a-zA-Z0-9]+$/;
export const invalidAlphanumericRegex = /[^a-zA-Z0-9]/g;

export function isProjectNameValid(projectName: string) {
  return !!projectName && projectName.length >= 3 && projectName.length <= 20 && validAlphanumericRegex.test(projectName);
}

export function normalizeProjectName(projectName: string) {
  if (!projectName) {
    projectName = `amplify${makeId(5)}`;
  }
  if (!isProjectNameValid(projectName)) {
    projectName = projectName.replace(invalidAlphanumericRegex, '');
    if (projectName.length < 3) {
      // add a random id to project name if too short
      projectName += makeId(5);
    } else if (projectName.length > 20) {
      projectName = projectName.substring(0, 20);
    }
  }
  return projectName;
}
