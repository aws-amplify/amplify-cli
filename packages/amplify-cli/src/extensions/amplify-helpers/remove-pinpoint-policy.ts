import * as path from 'path';
import * as fs from 'fs-extra';
import { pathManager, JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';

const projectBackendDirPath = pathManager.getBackendDirPath();
const pinpointTemplateFileName = 'pinpoint-cloudformation-template.json';

export function removeGetUserEndpoints(resourceName) {
  const resourceDirPath = path.join(projectBackendDirPath, 'analytics', resourceName);
  const pinpointTemplateFilePath = path.join(resourceDirPath, pinpointTemplateFileName);
  let pinpointTemplateFile: any = JSONUtilities.readJson(pinpointTemplateFilePath);
  pinpointTemplateFile.Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action = [
    'mobiletargeting:PutEvents',
    'mobiletargeting:UpdateEndpoint',
  ];
  pinpointTemplateFile.Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action = [
    'mobiletargeting:PutEvents',
    'mobiletargeting:UpdateEndpoint',
  ];
  const pinpointTemplateFileJSON = JSONUtilities.stringify(pinpointTemplateFile);
  fs.writeFileSync(pinpointTemplateFilePath, pinpointTemplateFileJSON);
}
