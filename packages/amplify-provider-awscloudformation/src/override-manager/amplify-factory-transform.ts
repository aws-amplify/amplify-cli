import { IAmplifyResource, AmplifyCategoryTransform } from 'amplify-cli-core';
import { AmplifyAuthTransform, AmplifyUserPoolGroupTransform } from '@aws-amplify/amplify-category-auth';

const categoryCfnTransformMap = (resource: IAmplifyResource) => ({
  auth: [new AmplifyUserPoolGroupTransform(resource.resourceName), new AmplifyAuthTransform(resource.resourceName)],
  // add factories here
});

export class AmplifyCategoryTransformFactory {
  public static getCategoryTransformInstance(resource: IAmplifyResource): AmplifyCategoryTransform[] {
    return categoryCfnTransformMap[resource.category];
  }
}
