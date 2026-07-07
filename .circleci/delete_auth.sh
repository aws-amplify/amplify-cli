#!/bin/sh -xv
cd ../aws-amplify-cypress-auth
DEPLOYMENT_BUCKET="s3://$(jq -r '.providers.awscloudformation.DeploymentBucketName' amplify/backend/amplify-meta.json)"
amplify-dev delete
echo "delete auth executed"
echo "deleting the deployment buckets"
aws s3 rb "$DEPLOYMENT_BUCKET" --force