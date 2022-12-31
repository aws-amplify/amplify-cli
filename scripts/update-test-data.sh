curl --request GET \
  --url 'https://circleci.com/api/v2/insights/gh/aws-amplify/amplify-cli/workflows/build_test_deploy_v3/test-metrics?branch=dev&all-branches=false' \
  --header "Circle-Token: $CIRCLECI_TOKEN" \
  -o ./scripts/cci-test.data.json