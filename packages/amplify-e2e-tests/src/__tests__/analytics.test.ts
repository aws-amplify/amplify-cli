import { initJSProjectWithProfile, initFlutterProjectWithProfile, amplifyPushUpdate, amplifyStatus, deleteProject } from 'amplify-e2e-core';
import { addPinpoint, addKinesis, removeAnalytics } from 'amplify-e2e-core';
import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import _ from 'lodash';
import { JSONUtilities } from 'amplify-cli-core';

describe('amplify add analytics', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('analytics');
  });

  afterEach(async () => {
    await removeAnalytics(projRoot, {});
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('add pinpoint for javascript', async () => {
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
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
    _.set(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
    _.set(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
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
    _.set(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
    _.set(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
    JSONUtilities.writeJson(pinpointTemplateFilePath, pinpointTemplateFile);
    await amplifyStatus(projRoot, 'No Change');
    pinpointTemplateFile = JSONUtilities.readJson(pinpointTemplateFilePath);
    unAuthAction = _.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
    authAction = _.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
    expect(_.includes(unAuthAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);
    expect(_.includes(authAction, 'mobiletargeting:GetUserEndpoints')).toBe(false);
  });

  it('add pinpoint for flutter', async () => {
    await initFlutterProjectWithProfile(projRoot, { name: 'storageTest' });
    const rightName = 'myapp';
    await addPinpoint(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'lib', 'amplifyconfiguration.dart'))).toBe(true);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });

  it('add kinesis', async () => {
    await initJSProjectWithProfile(projRoot, {disableAmplifyAppCreation: false });
    //setAmplifyAppIdInBackendAmplifyMeta(projRoot);
    const random = Math.floor(Math.random() * 10000);
    const rightName = `myapp${random}`;
    await addKinesis(projRoot, { rightName, wrongName: '$' });
    await amplifyPushUpdate(projRoot);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'analytics', rightName))).toBe(true);
  });
});
