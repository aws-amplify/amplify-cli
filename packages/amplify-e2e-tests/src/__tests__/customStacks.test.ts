import { amplifyPushUpdate, deleteProject, initJSProjectWithProfile } from '../init';
import * as path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { checkIfBucketExists, createNewProjectDir, deleteProjectDir, getProjectMeta } from '../utils';
import { checkoutEnvironment } from '../environment/add-env';

describe('custom cloudformation stacks', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('customStacks');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  const backendConfig = {
    customCategory: {
      customResource: {
        service: 'SES',
        providerPlugin: 'awscloudformation',
      },
    },
  };

  // Adapted from https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ses-template.html
  const templateConfig = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'AWS SES Template Sample Template',
    Parameters: {
      TemplateName: {
        Type: 'String',
        Default: 'defaulttemplate',
      },
      SubjectPart: {
        Type: 'String',
        Default: 'defaultsubject',
      },
      TextPart: {
        Type: 'String',
        Default: 'defaulttext',
      },
      HtmlPart: {
        Type: 'String',
        Default: 'defaulthtml',
      },
      env: {
        Type: 'String',
        Default: 'defaultenv',
      },
    },
    Resources: {
      Template: {
        Type: 'AWS::SES::Template',
        Properties: {
          Template: {
            TemplateName: {
              Ref: 'TemplateName',
            },
            SubjectPart: {
              Ref: 'SubjectPart',
            },
            TextPart: {
              Ref: 'TextPart',
            },
            HtmlPart: {
              Ref: 'HtmlPart',
            },
          },
        },
      },
    },
  };

  // https://aws-amplify.github.io/docs/cli-toolchain/quickstart#custom-cloudformation-stacks
  it('create stack for SES and push', async () => {
    await initJSProjectWithProfile(projRoot, { envName: 'env' });

    const backendPath = projRoot + '/amplify/backend/';
    const backendConfigPath = backendPath + 'backend-config.json';
    const customPath = backendPath + 'customCategory/customResource/';
    const templatePath = customPath + 'template.json';

    mkdirSync(customPath, { recursive: true });
    writeFileSync(backendConfigPath, JSON.stringify(backendConfig));
    writeFileSync(templatePath, JSON.stringify(templateConfig));

    expect(existsSync(backendConfigPath)).toBeTruthy();
    expect(existsSync(templatePath)).toBeTruthy();

    await checkoutEnvironment(projRoot, { envName: 'env' });
    await amplifyPushUpdate(projRoot);

    const meta = getProjectMeta(projRoot);

    const { DeploymentBucketName: bucketName, Region: region } = meta.providers.awscloudformation;
    expect(bucketName).toBeDefined();
    expect(region).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});

    const { customResource } = meta.customCategory;
    expect(customResource).toBeDefined();
    expect(customResource.service).toEqual('SES');
    expect(customResource.providerPlugin).toEqual('awscloudformation');
    expect(customResource.lastPushDirHash).toBeDefined();
  });
});
