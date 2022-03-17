import * as path from 'path';
import * as fs from 'fs-extra';
import { pathManager, JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';

const pinpointTemplateFileName = 'pinpoint-cloudformation-template.json';

export function removeGetUserEndpoints(resourceName) {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const pinpointTemplateFilePath = path.join(projectBackendDirPath, 'analytics', resourceName, pinpointTemplateFileName);
  if (fs.existsSync(pinpointTemplateFilePath)) {
    let pinpointTemplateFile: any = JSONUtilities.readJson(pinpointTemplateFilePath);
    const unAuthAction = _.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
    const authAction = _.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
    _.remove(unAuthAction, action => action === 'mobiletargeting:GetUserEndpoints');
    _.remove(authAction, action => action === 'mobiletargeting:GetUserEndpoints');
    _.set(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
    _.set(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
    JSONUtilities.writeJson(pinpointTemplateFilePath, pinpointTemplateFile);
  }
}
