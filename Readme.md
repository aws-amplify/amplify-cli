# Docker image for e2e test

This branch contains the code for buildng the docker image used in Amplify CLI End-to-End tests. This image is used as base image with all the Lambda runtime dependecies installed. When image needs an update, push the changes to this branch and CodeBuild workflow will build and publish a new image to ECR repository