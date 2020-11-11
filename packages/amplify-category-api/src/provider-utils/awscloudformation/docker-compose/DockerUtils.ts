import yaml from 'js-yaml';
import * as v1Types from './compose-spec/v1';
import * as v2Types from './compose-spec/v2';
import { BuildHashMap } from './ecs-objects/types';

export const dockerComposeToObject = (yamlFileContents: string): v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json => {
  try {
    const doc = yaml.safeLoad(yamlFileContents);
    return doc as v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json;
  } catch (e) {
    console.log(e);

    throw e;
  }
};

export const dockerfileToObject = (dockerfileContents: string): v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json => {
  const lines = dockerfileContents?.split('\n') ?? [];
  const ports = lines.filter(line => /^\s*EXPOSE\s+/.test(line)).map(line => line.match(/\s+(\d+)/)[1]);

  const composeContents = `version: "3"
services:
  api:
    build: .${ports.length > 0 ? `
    ports: ${ports.map(port => `
      - '${port}:${port}'`).join('')
      }` : ``}
`;

  return dockerComposeToObject(composeContents);
}

export const generateBuildSpec = (containerMap: BuildHashMap) => {
  return `version: 0.2

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
      - echo Building the Docker image...${Object.keys(containerMap).map(item => `
      - docker build -t $${item}_REPOSITORY_URI:latest ./${containerMap[item]}
      - docker tag $${item}_REPOSITORY_URI:latest $${item}_REPOSITORY_URI:$IMAGE_TAG`)
    }
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images..${Object.keys(containerMap).map(item => `
      - docker push $${item}_REPOSITORY_URI:latest
      - docker push $${item}_REPOSITORY_URI:$IMAGE_TAG`)}
      - "echo \\"[${Object.keys(containerMap)
      .map(name => `{\\\\\\\"name\\\\\\\":\\\\\\\"${name}\\\\\\\", \\\\\\\"imageUri\\\\\\\":\\\\\\\"$${name}_REPOSITORY_URI\\\\\\\"}`)
      .join(',')
    }]\\" > imagedefinitions.json"
artifacts:
  files: imagedefinitions.json
`;
};

