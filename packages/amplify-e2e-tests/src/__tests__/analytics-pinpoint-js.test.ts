import {
  initJSProjectWithProfile,
  amplifyPushUpdate,
  amplifyStatus,
  deleteProject,
  addPinpoint,
  removeAnalytics,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

describe('amplify add analytics', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('analytics');
  });

  afterEach(async () => {
    await removeAnalytics(projRoot);
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add pinpoint for javascript', async () => {
    await initJSProjectWithProfile(projRoot, {});
    const rightName = 'myapp';
    await addPinpoint(projRoot, { rightName, wrongName: '$' });
    const pinpointTemplateFilePath = path.join(
      projRoot,
      'amplify',
      'backend',
      'analytics',
      rightName,
      'pinpoint-cloudformation-template.json',
    );
    expect(fs.existsSync(pinpointTemplateFilePath)).toBe(true);
    let pinpointTemplateFile: any = JSONUtilities.readJson(pinpointTemplateFilePath);
    let unAuthAction = _.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
    let authAction = _.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
    expect(_.includes(unAuthAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);
    expect(_.includes(authAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);

    // manually add getUserEndpoints policy to verify that it is removed on push
    unAuthAction.push('mobiletargeting:GetUserEndpoints');
    authAction.push('mobiletargeting:GetUserEndpoints');
    _.setWith(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
    _.setWith(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
    JSONUtilities.writeJson(pinpointTemplateFilePath, pinpointTemplateFile);
    await amplifyPushUpdate(projRoot, /Pinpoint URL to track events.*/);
    pinpointTemplateFile = JSONUtilities.readJson(pinpointTemplateFilePath);
    unAuthAction = _.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
    authAction = _.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
    expect(_.includes(unAuthAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);
    expect(_.includes(authAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);

    // manually add getUserEndpoints policy to verify that it is removed on status
    unAuthAction.push('mobiletargeting:GetUserEndpoints');
    authAction.push('mobiletargeting:GetUserEndpoints');
    _.setWith(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
    _.setWith(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
    JSONUtilities.writeJson(pinpointTemplateFilePath, pinpointTemplateFile);
    await amplifyStatus(projRoot, 'No Change');
    pinpointTemplateFile = JSONUtilities.readJson(pinpointTemplateFilePath);
    unAuthAction = _.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
    authAction = _.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
    expect(_.includes(unAuthAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);
    expect(_.includes(authAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);
  });
});
