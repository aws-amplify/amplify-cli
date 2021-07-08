import { SynthUtils } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';

import * as rootStack from '../../root-stack-builder/root-stack-builder';

test('Generated rootstack template', () => {
  const stack = new rootStack.AmplifyRootStack(null, 'rootStack');
  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
