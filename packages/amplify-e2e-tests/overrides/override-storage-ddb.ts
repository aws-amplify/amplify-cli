import { AmplifyDDBResourceTemplate, AmplifyProjectInfo } from '@aws-amplify/cli-extensibility-helper';

export function override(props: AmplifyDDBResourceTemplate, projectInfo: AmplifyProjectInfo): void {
  props.dynamoDBTable.streamSpecification = {
    streamViewType: 'NEW_AND_OLD_IMAGES',
  };

  if (!projectInfo || !projectInfo.envName || !projectInfo.projectName) {
    throw new Error('Project info is missing in override');
  }
}
