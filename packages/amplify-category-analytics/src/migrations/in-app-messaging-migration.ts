import {
  $TSAny,
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  JSONUtilities,
  pathManager,
  stateManager,
  readCFNTemplate,
  writeCFNTemplate,
} from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import * as path from 'path';
import { analyticsPush } from '../commands/analytics';
import { invokeAuthPush } from '../plugin-client-api-auth';
import { getAllDefaults } from '../provider-utils/awscloudformation/default-values/pinpoint-defaults';
import { getAnalyticsResources } from '../utils/analytics-helper';

import {
  getNotificationsCategoryHasPinpointIfExists,
  getPinpointRegionMappings,
  pinpointHasInAppMessagingPolicy,
  pinpointInAppMessagingPolicyName,
} from '../utils/pinpoint-helper';

/**
 * checks if the project has been migrated to the latest version of in-app messaging
 */
export const inAppMessagingMigrationCheck = async (context: $TSContext): Promise<void> => {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const resources = getAnalyticsResources(context);

  if (resources.length > 0 && !pinpointHasInAppMessagingPolicy(context)) {
    const amplifyMeta = stateManager.getMeta();
    const analytics = amplifyMeta[AmplifyCategories.ANALYTICS] || {};
    Object.keys(analytics).forEach((resourceName) => {
      const analyticsResourcePath = path.join(projectBackendDirPath, AmplifyCategories.ANALYTICS, resourceName);
      const templateFilePath = path.join(analyticsResourcePath, 'pinpoint-cloudformation-template.json');
      if (fs.existsSync(templateFilePath)) {
        const cfn = JSONUtilities.readJson(templateFilePath);
        const updatedCfn = migratePinpointCFN(cfn);
        fs.ensureDirSync(analyticsResourcePath);
        JSONUtilities.writeJson(templateFilePath, updatedCfn);
      }
    });
  }

  const pinpointApp = getNotificationsCategoryHasPinpointIfExists();
  if (resources.length === 0 && pinpointApp) {
    const resourceParameters = getAllDefaults(context.amplify.getProjectDetails());
    const notificationsInfo = {
      appName: pinpointApp.appName,
      resourceName: pinpointApp.appName,
    };

    Object.assign(resourceParameters, notificationsInfo);

    const resource = resourceParameters.resourceName;
    delete resourceParameters.resourceName;
    const analyticsResourcePath = path.join(projectBackendDirPath, AmplifyCategories.ANALYTICS, resource);
    stateManager.setResourceParametersJson(undefined, AmplifyCategories.ANALYTICS, resource, resourceParameters);

    const templateFileName = 'pinpoint-cloudformation-template.json';
    const templateFilePath = path.join(analyticsResourcePath, templateFileName);
    if (!fs.existsSync(templateFilePath)) {
      const templateSourceFilePath = path.join(
        __dirname,
        '..',
        'provider-utils',
        'awscloudformation',
        'cloudformation-templates',
        templateFileName,
      );
      const { cfnTemplate } = readCFNTemplate(templateSourceFilePath);
      cfnTemplate.Mappings = await getPinpointRegionMappings();
      await writeCFNTemplate(cfnTemplate, templateFilePath);
    }

    const options = {
      service: AmplifySupportedService.PINPOINT,
      providerPlugin: 'awscloudformation',
    };
    context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.ANALYTICS, resource, options);

    context.parameters.options = context.parameters.options ?? {};
    context.parameters.options.yes = true;
    context.exeInfo.inputParams = context.exeInfo.inputParams || {};
    context.exeInfo.inputParams.yes = true;

    await invokeAuthPush(context);
    await analyticsPush(context);
  }
};

const migratePinpointCFN = (cfn: $TSAny): $TSAny => {
  const { Parameters, Conditions, Resources } = cfn;

  Parameters[pinpointInAppMessagingPolicyName] = {
    Type: 'String',
    Default: 'NONE',
  };

  Conditions.ShouldEnablePinpointInAppMessaging = {
    'Fn::Not': [
      {
        'Fn::Equals': [
          {
            Ref: 'pinpointInAppMessagingPolicyName',
          },
          'NONE',
        ],
      },
    ],
  };

  Resources.PinpointInAppMessagingPolicy = {
    Condition: 'ShouldEnablePinpointInAppMessaging',
    Type: 'AWS::IAM::Policy',
    Properties: {
      PolicyName: {
        Ref: 'pinpointInAppMessagingPolicyName',
      },
      Roles: [
        {
          Ref: 'unauthRoleName',
        },
        {
          Ref: 'authRoleName',
        },
      ],
      PolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['mobiletargeting:GetInAppMessages'],
            Resource: [
              {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:mobiletargeting:',
                    {
                      'Fn::FindInMap': [
                        'RegionMapping',
                        {
                          Ref: 'AWS::Region',
                        },
                        'pinpointRegion',
                      ],
                    },
                    ':',
                    {
                      Ref: 'AWS::AccountId',
                    },
                    ':apps/',
                    {
                      'Fn::GetAtt': ['PinpointFunctionOutputs', 'Id'],
                    },
                    '*',
                  ],
                ],
              },
            ],
          },
        ],
      },
    },
  };

  return cfn;
};
