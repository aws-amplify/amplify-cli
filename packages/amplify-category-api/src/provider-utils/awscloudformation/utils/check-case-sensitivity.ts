import fs from 'fs-extra';
import path from 'path';

export const checkCaseSensitivityIssue = async (context: any, category: string, resourceName: string) => {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  const caseSensitivityConflict = async () => {
    const basePath = path.join(projectBackendDirPath, category);
    const filenames = await fs.readdir(basePath);
    const lowerCaseMatch = filenames.find(name => name.toLowerCase() === resourceName.toLowerCase());
    return lowerCaseMatch === resourceName ? false : lowerCaseMatch;
  };

  const conflict = await caseSensitivityConflict();
  if (conflict) {
    context.print.error(
      `Unable to create resource with name ${resourceName} since a resource named ${conflict} already exists. Amplify resource names are case-insensitive.`,
    );
    process.exit(1);
  }
};
