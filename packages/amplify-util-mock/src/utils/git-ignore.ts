import * as fs from 'fs-extra';
import * as os from 'os';

export function addMockDataToGitIgnore(context) {
  const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath();
  if (fs.existsSync(gitIgnoreFilePath)) {
    const gitIgnoreContent = fs
      .readFileSync(gitIgnoreFilePath)
      .toString()
      .split(os.EOL);
    const gitIgnoreSet = new Set<string>(gitIgnoreContent);
    const amplifyMockData = 'amplify/mock-data';
    if (!gitIgnoreSet.has(amplifyMockData)) {
      gitIgnoreSet.add(amplifyMockData);
      fs.writeFileSync(gitIgnoreFilePath, [...gitIgnoreSet.keys()].join(os.EOL));
    }
  }
}
