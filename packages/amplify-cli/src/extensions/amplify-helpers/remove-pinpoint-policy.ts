/* eslint-disable spellcheck/spell-checker */
import * as path from 'path';
import * as fs from 'fs-extra';
import { pathManager, JSONUtilities, $TSAny } from 'amplify-cli-core';
import _ from 'lodash';

const pinpointTemplateFileName = 'pinpoint-cloudformation-template.json';

/**
 * [Legacy - Remove this] Code to remove GetUserEndpoints prior to amplify push
 * note: This function is getting called from the Get updated resources flow.
 * @param resourceName Name of Pinpoint resource
 */
export const removeGetUserEndpoints = (resourceName: string):void => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const pinpointTemplateFilePath = path.join(projectBackendDirPath, 'analytics', resourceName, pinpointTemplateFileName);
  if (fs.existsSync(pinpointTemplateFilePath)) {
    const pinpointTemplateFile: $TSAny = JSONUtilities.readJson(pinpointTemplateFilePath);
    const unAuthAction = _.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
    const authAction = _.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
    _.remove(unAuthAction, action => action === 'mobiletargeting:GetUserEndpoints');
    _.remove(authAction, action => action === 'mobiletargeting:GetUserEndpoints');
    _.set(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
    _.set(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
    JSONUtilities.writeJson(pinpointTemplateFilePath, pinpointTemplateFile);
  }
};
