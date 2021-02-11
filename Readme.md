# Docker image for e2e test

This branch contains the code for buildng the docker image used in Amplify CLI End-to-End tests. This image is used as base image with all the Lambda runtime dependecies installed. When image needs an update, push the changes to this branch and CircleCI workflow will build and publish a new image to ECR repository

To build this image the following CircleCI configuration is needed

1. Context with the name `amplify-cli-ecr` which has the following environment variables

- `AWS_ECR_ACCOUNT_URL` URL of ECR repository. This needs to contain just the host name
- `ECR_REGION` Region of ECR repository
- `ECR_ACCESS_KEY` AWS Access key used for ECR
- `ECR_SECRET_ACCESS_KEY` AWS Secret Access for ECR
