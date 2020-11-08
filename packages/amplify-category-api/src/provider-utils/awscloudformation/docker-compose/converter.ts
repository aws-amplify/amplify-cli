//Use for zipping:
//https://github.com/aws-amplify/amplify-cli/blob/3ec96f7616bff62b7a65e20a643b9a0f7c12b05a/packages/amplify-provider-awscloudformation/src/zip-util.js

import path from 'path';

import { IBuildHashMap, PortMappings } from './ecs-objects/types';

//https://github.com/gfi-centre-ouest/docker-compose-spec-typescript
//

import * as v1Types from './compose-spec/v1';
import * as v2Types from './compose-spec/v2';
import * as v3Types from './compose-spec/v3';
import * as v38Types from './compose-spec/v3.8';

import Container from './ecs-objects/Container';
import { dockerComposeToObject, writeBuildFiles } from './DockerUtils';
import Service from './ecs-objects/Service';

const isv1Schema = (obj: any): obj is v1Types.ConfigSchemaV1Json => {
  return obj && obj.version === undefined;
};

const hasHealthCheck = (obj: any): obj is v2Types.DefinitionsHealthcheck => {
  return obj.healthcheck !== undefined;
};

const mapComposeEntriesToContainer = (record: [string, v1Types.DefinitionsService | v2Types.DefinitionsService]): Container => {
  let containerPort: string | number | undefined;
  let hostPort: string | number | undefined;

  const [k, v] = record;

  const { image, ports, build, command, entrypoint, env_file, environment, working_dir, user } = v;
  const { container_name: name = k } = v;

  var healthcheck: v2Types.DefinitionsHealthcheck = {};
  if (hasHealthCheck(v)) {
    Object.entries(v).forEach((item: [string, v2Types.DefinitionsHealthcheck]) => {
      const [helthKey, healthVal] = item;
      if (healthVal.test !== undefined) {
        healthcheck = healthVal;
      }
    });
  }

  let portArray: PortMappings = [];
  ports?.forEach(item => {
    //For task definitions that use the awsvpc network mode, you should only specify the containerPort.
    //The hostPort can be left blank or it must be the same value as the containerPort.
    [containerPort, hostPort = containerPort] = item.toString().split(':');
    portArray.push({
      containerPort,
      hostPort,
      protocol: 'tcp',
    });
  });

  return new Container(
    build,
    name,
    portArray,
    command,
    entrypoint,
    env_file,
    environment,
    image,
    {
      command: healthcheck.test,
      ...healthcheck,
    },
    working_dir,
    user,
  );
};

const convertDockerObjectToContainerArray = (yamlObject: v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json) => {
  let containerArr: Container[] = [];

  if (isv1Schema(yamlObject)) {
    Object.entries(yamlObject).forEach((record: [string, v1Types.DefinitionsService]) => {
      const container = mapComposeEntriesToContainer(record);
      containerArr.push(container);
    });
  } else {
    Object.entries(yamlObject.services ?? {}).forEach((record: [string, v2Types.DefinitionsService]) => {
      const container = mapComposeEntriesToContainer(record);
      containerArr.push(container);
    });
  }
  return containerArr;
};

const findServiceDeployment = (
  yamlObject: v38Types.ComposeSpecification | v2Types.ConfigSchemaV24Json | v1Types.ConfigSchemaV1Json,
): v38Types.DefinitionsDeployment2 => {
  let result: v38Types.DefinitionsDeployment2 = {};

  Object.entries(yamlObject.services ?? {}).forEach((record: [string, v38Types.DefinitionsService]) => {
    const [k, v] = record;
    const { deploy } = v;

    if (deploy !== undefined) {
      result = deploy!;
    }
  });

  return result;
};

const convert = () => {
  //Step 1: Detect if there is a docker-compose or just a Dockerfile.
  //        Just Dockerfile-> create registry using function name, buildspec, zip and put on S3
  //        Compose file -> Begin by parsing it:
  const here = path.basename(__dirname);
  let docker_compose = dockerComposeToObject(here + '/tests/docker-compose3.yml');

  //Step 2: Take compose object and pull all the containers out:
  var Containers: Container[] = [];
  Containers = convertDockerObjectToContainerArray(docker_compose);

  //Step 3: Populate Build mapping for creation of the buildpsec
  let buildmapping: IBuildHashMap = {};
  Containers.forEach(res => {
    if (typeof res.build === 'object') {
      //console.log(res.build.args);
    }
    if (typeof res.healthcheck === 'object') {
      //console.log(res.healthcheck.command)
    }
    //Step 4: Create ECR Entry if build is specified - TODO with Francisco..... - this will go in registryArn
    if (res.build != undefined) {
      let buildContext: string = '';
      typeof res.build === 'object' && (buildContext = res.build.context!);

      //Wont need this if statement later, just using for testing
      /** This will look like this for each container where res.build != undefined:
       * let registryArn = new ecr.Repository(this, res.name, {});
       * buildmapping[res.name] = {buildPath: buildContext, registryArn };
       */
      console.log(res.name + ' is name');
      if (res.name === 'frontend') {
        buildmapping[res.name] = { buildPath: buildContext, registryArn: '943406933601.dkr.ecr.us-east-1.amazonaws.com/frontend' };
      } else {
        buildmapping['backend'] = { buildPath: buildContext, registryArn: '943406933601.dkr.ecr.us-east-1.amazonaws.com/backend' };
      }
    }
  });

  //Step 5: Write the buildfiles and zip everything up
  writeBuildFiles(buildmapping);
  //zipfile = zipFile(res.build.context)
  //uploadS3(zipfile)

  //Step 6: Create the service object to become Task Definition
  const deployment = findServiceDeployment(docker_compose);
  //Create ECS Task Def to pass back
  const service = new Service(Containers, undefined, deployment);

  console.log(`desired count is ${service.desiredCount}`);
  console.log(service);
};

export default convert;
