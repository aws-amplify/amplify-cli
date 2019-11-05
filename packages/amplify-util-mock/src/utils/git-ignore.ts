import * as fs from 'fs-extra';
import * as os from 'os';

export function addMockDataToGitIgnore(context) {
  const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath();
  if (fs.existsSync(gitIgnoreFilePath)) {
    const gitIgnoreContent = fs
      .readFileSync(gitIgnoreFilePath)
      .toString()
      .split(os.EOL);
    const gitIgnoreMap = gitIgnoreContent.reduce((map, val) => {
      map.set(val, true);
      return map;
    }, new Map<string, boolean>());
    const amplifyMockData = 'amplify/mock-data';
    if (!gitIgnoreMap.has(amplifyMockData)) {
      gitIgnoreMap.set(amplifyMockData, true);
      fs.writeFileSync(gitIgnoreFilePath, [...gitIgnoreMap.keys()].join(os.EOL));
    }
  }
}
