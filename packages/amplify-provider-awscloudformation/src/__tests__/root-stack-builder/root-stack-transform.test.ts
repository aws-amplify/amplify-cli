import { AmplifyRootStackTransform, CommandType, RootStackTransformOptions } from '../../root-stack-builder/root-stack-transform';
import * as path from 'path';
import { prePushCfnTemplateModifier } from '../../pre-push-cfn-processor/pre-push-cfn-modifier';

jest.mock('amplify-cli-core');

jest.mock('../../utils/override-skeleton-generator');

describe('Check RootStack Template', () => {
  it('Generated rootstack template during init', async () => {
    // CFN transform for Root stack
    const rootStackFileName = 'template.json';
    const props: RootStackTransformOptions = {
      resourceConfig: {
        stackFileName: rootStackFileName,
      },
      cfnModifiers: prePushCfnTemplateModifier,
    };
    const rootTransform = new AmplifyRootStackTransform(props, CommandType.INIT);
    const mock_template = await rootTransform.transform();
    expect(mock_template).toMatchSnapshot();
  });

  it('Generated rootstack template during Push with overrides', async () => {
    // CFN transform for Root stack
    const rootStackFileName = 'template.json';
    const rootFilePath = 'randomPath';
    const overridePath = path.join(__dirname, 'overrides', 'override.js');
    const overrideDir = path.join(__dirname, 'overrides');

    const props: RootStackTransformOptions = {
      resourceConfig: {
        stackFileName: rootStackFileName,
      },
      deploymentOptions: {
        rootFilePath,
      },
      overrideOptions: {
        overrideFnPath: overridePath,
        overrideDir,
      },
      cfnModifiers: prePushCfnTemplateModifier,
    };
    const rootTransform = new AmplifyRootStackTransform(props, CommandType.PUSH);
    const mock_template = await rootTransform.transform();
    expect(mock_template).toMatchSnapshot();
  });
});
