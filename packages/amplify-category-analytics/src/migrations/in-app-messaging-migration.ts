import {
  $TSAny,
  $TSContext, AmplifyCategories, JSONUtilities, pathManager, stateManager,
} from 'amplify-cli-core';
import fs from 'fs-extra';
import * as path from 'path';
import { pinpointHasInAppMessagingPolicy } from '../utils/pinpoint-helper';

/**
 * checks if the project has been migrated to the latest version of in-app messaging
 */
export const inAppMessagingMigrationCheck = async (context: $TSContext): Promise<void> => {
  if (['add', 'update', 'push'].includes(context.input.command) && !pinpointHasInAppMessagingPolicy(context)) {
    const projectBackendDirPath = pathManager.getBackendDirPath();
    const amplifyMeta = stateManager.getMeta();
    const analytics = amplifyMeta[AmplifyCategories.ANALYTICS] || {};
    Object.keys(analytics).forEach(resourceName => {
      const resourcePath = path.join(projectBackendDirPath, AmplifyCategories.ANALYTICS, resourceName);
      const templateFilePath = path.join(resourcePath, 'pinpoint-cloudformation-template.json');
      const cfn = JSONUtilities.readJson(templateFilePath);
      const updatedCfn = migratePinpointCFN(cfn);
      fs.ensureDirSync(resourcePath);
      fs.writeFileSync(templateFilePath, JSON.stringify(updatedCfn, null, 4), 'utf8');
    });
  }
};

const migratePinpointCFN = (cfn: $TSAny): $TSAny => {
  const { Parameters, Conditions, Resources } = cfn;

  Parameters.pinpointInAppMessagingPolicyName = {
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
            Action: [
              'mobiletargeting:GetInAppMessages',
            ],
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
                      'Fn::GetAtt': [
                        'PinpointFunctionOutputs',
                        'Id',
                      ],
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
