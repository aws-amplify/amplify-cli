function updateJobData {
  curl --request GET \
    --url 'https://circleci.com/api/v2/insights/github/aws-amplify/amplify-cli/workflows/build_test_deploy_v3/jobs?analytics-segmentation=web-ui-insights&all-branches=true&reporting-window=last-7-days' \
    --header "Circle-Token: $CIRCLECI_TOKEN" \
    -o ./scripts/cci-job.data.json
}

function updateTestData {
  curl --request GET \
    --url 'https://circleci.com/api/v2/insights/gh/aws-amplify/amplify-cli/workflows/build_test_deploy_v3/test-metrics?branch=dev&all-branches=false' \
    --header "Circle-Token: $CIRCLECI_TOKEN" \
    -o ./scripts/cci-test.data.json
}