const { getIAMPolicies } = require('../provider-utils/awscloudformation/service-walkthroughs/apigw-walkthrough');

test('getIAMPolicies', () => {
  output = getIAMPolicies('resourceName', ['read'])
  expect(output.attributes).toStrictEqual(['ApiName', 'ApiId'])
})