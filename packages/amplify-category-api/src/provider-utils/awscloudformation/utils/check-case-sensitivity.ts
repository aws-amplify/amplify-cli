import fs from 'fs-extra';
import path from 'path';

export const checkCaseSensitivityIssue = async (context: any, category: string, resourceName: string) => {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  const fsIsCaseSensitive = async () => {
    const tempFileName = '/tmp/AMPLIFY-TEMP';
    await fs.writeFile(tempFileName, 'deleteme');
    const lowercaseVersionExists = fs.existsSync(tempFileName.toLowerCase());
    await fs.unlink(tempFileName);
    return !lowercaseVersionExists;
  };

  const caseSensitiveMatchExists = async () => {
    const basePath = path.join(projectBackendDirPath, category);
    const filenames = await fs.readdir(basePath);
    const matchExistsWhenAllLowercase = filenames.map(name => name.toLowerCase()).includes(resourceName.toLowerCase());
    const matchExistsDirectly = filenames.includes(resourceName);
    return !matchExistsDirectly && matchExistsWhenAllLowercase;
  };

  if (!(await fsIsCaseSensitive()) && (await caseSensitiveMatchExists())) {
    context.print.error(
      `Unable to create resource with name ${resourceName} since your filesystem is case-insensitive and a case-sensitive match already exists.`,
    );
    process.exit(1);
  }
};
