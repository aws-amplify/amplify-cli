import { $TSContext } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getMockDataDirectory, getMockAPIResourceDirectory } from './mock-directory';

export function addMockDataToGitIgnore(context: $TSContext) {
  addMockDirectoryToGitIgnore(context, getMockDataDirectory(context));
}

export function addMockAPIResourcesToGitIgnore(context: $TSContext) {
  addMockDirectoryToGitIgnore(context, getMockAPIResourceDirectory(context));
}

function addMockDirectoryToGitIgnore(context: $TSContext, directory: string) {
  const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath();
  if (fs.existsSync(gitIgnoreFilePath)) {
    const gitRoot = path.dirname(gitIgnoreFilePath);
    const directoryRelativeToGitRoot = path.relative(gitRoot, directory).replace(/\\/g, '/');
    let gitIgnoreContent = fs.readFileSync(gitIgnoreFilePath).toString();
    if (gitIgnoreContent.search(RegExp(`^\\s*${directoryRelativeToGitRoot}\\w*$`, 'gm')) === -1) {
      gitIgnoreContent += '\n' + directoryRelativeToGitRoot;
      fs.writeFileSync(gitIgnoreFilePath, gitIgnoreContent);
    }
  }
}
