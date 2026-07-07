import { ensureHeadlessParameters } from '../../../../provider-utils/awscloudformation/import/ensure-headless-parameters';
import { ResourceParameters } from '../../../../provider-utils/awscloudformation/import/types';

test('throws amplify error when auth headless params are missing during import auth', async () => {
  const resourceParams: ResourceParameters = {
    authSelections: 'identityPoolAndUserPool',
    region: 'mockRegion',
    resourceName: 'mockResourceName',
    serviceType: 'imported',
  };
  expect(() =>
    ensureHeadlessParameters(resourceParams, {
      userPoolId: '',
      webClientId: '',
      nativeClientId: '',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"auth headless is missing the following inputParameters userPoolId, webClientId, nativeClientId, identityPoolId"`,
  );
});
