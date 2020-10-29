import fs from 'fs-extra';
import path from 'path';
import { topLevelCommentPrefix, topLevelCommentSuffix } from '../../../constants';
import _ from 'lodash';
/**
 * This is legacy code that has been copied here.
 * In the future we either need to get rid of the top level comment entirely, or create a template hook to modify it
 */
export const tryUpdateTopLevelComment = (resourceDirPath: string, envVars: string[]) => {
  const newComment = createTopLevelComment(envVars);
  const appJSFilePath = path.join(resourceDirPath, 'src', 'app.js');
  const indexJSFilePath = path.join(resourceDirPath, 'src', 'index.js');
  if (fs.existsSync(appJSFilePath)) {
    updateTopLevelComment(appJSFilePath, newComment);
  } else if (fs.existsSync(indexJSFilePath)) {
    updateTopLevelComment(indexJSFilePath, newComment);
  }
};

const createTopLevelComment = (envVars: string[]) => `${topLevelCommentPrefix}${envVars.sort().join('\n\t')}${topLevelCommentSuffix}`;

const updateTopLevelComment = (filePath, newComment) => {
  const commentRegex = new RegExp(`${_.escapeRegExp(topLevelCommentPrefix)}[a-zA-Z0-9\\-\\s._=]+${_.escapeRegExp(topLevelCommentSuffix)}`);
  let fileContents = fs.readFileSync(filePath).toString();
  const commentMatches = fileContents.match(commentRegex);
  if (!commentMatches || commentMatches.length === 0) {
    fileContents = newComment + fileContents;
  } else {
    fileContents = fileContents.replace(commentRegex, newComment);
  }
  fs.writeFileSync(filePath, fileContents);
};
