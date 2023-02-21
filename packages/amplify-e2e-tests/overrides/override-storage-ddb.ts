import { AmplifyDDBResourceTemplate, AmplifyProjectInfo } from '@aws-amplify/cli-extensibility-helper';

export function override(props: AmplifyDDBResourceTemplate, amplifyProjectInfo: AmplifyProjectInfo): void {
  props.dynamoDBTable.streamSpecification = {
    streamViewType: 'NEW_AND_OLD_IMAGES',
  };

  if (!amplifyProjectInfo || !amplifyProjectInfo.envName || !amplifyProjectInfo.projectName) {
    throw new Error('Project info is missing in override');
  }
}
