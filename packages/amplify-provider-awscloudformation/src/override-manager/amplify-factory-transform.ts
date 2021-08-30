import { AmplifyCategories, CLISubCommands, IAmplifyResource } from 'amplify-cli-core';
import { AmplifyAuthTransform } from '@aws-amplify/amplify-category-auth';
import { AmplifyCategoryTransform } from 'amplify-category-plugin-interface';
import { AmplifyUserPoolGroupTransform } from '@aws-amplify/amplify-category-auth/lib/provider-utils/awscloudformation/auth-stack-builder';

export class AmplifyCategoryTransformFactory {
  public static getCategoryTransformInstance(resource: IAmplifyResource): AmplifyCategoryTransform[] {
    if (resource.category === AmplifyCategories.AUTH) {
      return [
        new AmplifyUserPoolGroupTransform(resource.resourceName, CLISubCommands.UPDATE),
        new AmplifyAuthTransform(resource.resourceName, CLISubCommands.UPDATE),
      ];
    } else if (resource.category === AmplifyCategories.STORAGE) {
      throw new Error('Not yet implemented');
    }
  }
}
