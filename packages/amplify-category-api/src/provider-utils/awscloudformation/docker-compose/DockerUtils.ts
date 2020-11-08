import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import * as v1Types from './compose-spec/v1';
import * as v2Types from './compose-spec/v2';
import { IBuildHashMap } from './ecs-objects/types';
import { stringify } from 'querystring';

const here = path.basename(__dirname);

const DEFAULT_DOCKER_COMPOSE = here + '/docker-compose.yml';
const DEFAULT_BUILDSPEC = 'buildspec.yml';
const DEFAULT_CONTAINER_DEFINITION = 'imagedefinitions.json';

const dockerComposeToObject = (yamlfile?: string): v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json => {
  let readfile = yamlfile || DEFAULT_DOCKER_COMPOSE;
  try {
    const doc = yaml.safeLoad(fs.readFileSync(readfile, 'utf8'));
    return doc as v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json;
  } catch (e) {
    console.log(e);
  }
  return {};
};

const writeBuildFiles = (containerMap: IBuildHashMap, buldspecPath?: string) => {
  writeBuildSpec(containerMap, buldspecPath);
  writeImageDefinitionsJson(containerMap, DEFAULT_CONTAINER_DEFINITION);
};

const writeImageDefinitionsJson = (containerMap: IBuildHashMap, imagedefinitionsPath?: string) => {
  let fileToWrite = imagedefinitionsPath || DEFAULT_BUILDSPEC;

  let arr: { name: string; imageUri: string }[] = [];
  Object.keys(containerMap).forEach(item => {
    arr.push({ name: item, imageUri: containerMap[item].registryArn });
  });

  const jsonToWrite = JSON.stringify(arr);

  fs.writeFile(fileToWrite, jsonToWrite, err => {
    if (err) {
      console.log(err);
    }
  });
};

const writeBuildSpec = (containerMap: IBuildHashMap, buldspecPath?: string) => {
  let buildspec = `
  version: 0.2

  phases:
    install:
      runtime-versions:
        docker: 19
    pre_build:
      commands:
        - echo Logging in to Amazon ECR...
        - aws --version
        - $(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)
        - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
        - IMAGE_TAG=\${COMMIT_HASH:=latest}
    build:
      commands:
        - echo Build started on \`date\`
        - echo Building the Docker image...`;

  Object.keys(containerMap).forEach(item => {
    buildspec = buildspec += `\n        - docker build -t ${containerMap[item].registryArn}:latest ./${containerMap[item].buildPath}`;
    buildspec = buildspec += `\n        - docker tag ${containerMap[item].registryArn}:latest ${containerMap[item].registryArn}:$IMAGE_TAG`;
  });

  buildspec = buildspec += `\n    post_build:
      commands:
        - echo Build completed on \`date\`
        - echo Pushing the Docker images...`;

  Object.keys(containerMap).forEach(item => {
    buildspec = buildspec += `\n        - docker push ${containerMap[item].registryArn}:latest`;
    buildspec = buildspec += `\n        - docker push ${containerMap[item].registryArn}:$IMAGE_TAG`;
  });

  buildspec = buildspec += `\n    artifacts:
      files: imagedefinitions.json
  
  `;

  let fileToWrite = buldspecPath || DEFAULT_BUILDSPEC;
  fs.writeFile(fileToWrite, buildspec, err => {
    if (err) {
      console.log(err);
    }
  });
};

export { dockerComposeToObject, writeBuildFiles };
