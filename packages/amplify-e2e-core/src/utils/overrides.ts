import * as fs from 'fs-extra';

export const replaceOverrideFileWithProjectInfo = (srcPath: string, destPath: string, envName: string, projectName: string) => {
  const content = fs.readFileSync(srcPath).toString();
  const contentWithProjectInfo = content.replace('##EXPECTED_ENV_NAME', envName).replace('##EXPECTED_PROJECT_NAME', projectName);
  fs.writeFileSync(destPath, contentWithProjectInfo);
};
