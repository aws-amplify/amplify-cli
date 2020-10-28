import { getIAMPolicies } from '../../../../provider-utils/awscloudformation/service-walkthroughs/apigw-walkthrough';

test('getIAMPolicies', () => {
  const output = getIAMPolicies('resourceName', ['read']);
  expect(output.attributes).toStrictEqual(['ApiName', 'ApiId']);
});
