import * as v1Types from './compose-spec/v1';
import * as v2Types from './compose-spec/v2';
import * as v38Types from './compose-spec/v3.8';
import { dockerComposeToObject, dockerfileToObject, generateBuildSpec } from './DockerUtils';
import Container from './ecs-objects/container';
import { BuildHashMap, PortMappings } from './ecs-objects/types';

const isv1Schema = (obj: any): obj is v1Types.ConfigSchemaV1Json => {
  return obj && obj.version === undefined;
};

const hasHealthCheck = (obj: any): obj is v2Types.DefinitionsHealthcheck => {
  return obj.healthcheck !== undefined;
};

function isV38Service(obj: any): obj is v38Types.DefinitionsService {
  return obj && (<v38Types.DefinitionsService>obj).secrets !== undefined;
}
const mapComposeEntriesToContainer = (record: [string, v1Types.DefinitionsService | v2Types.DefinitionsService]): Container => {
  const [k, v] = record;

  const { image, ports, build, command, entrypoint, env_file, environment, working_dir, user } = v;
  const { container_name: name = k } = v;

  var healthcheck: v2Types.DefinitionsHealthcheck = {};
  if (hasHealthCheck(v)) {
    Object.entries(v).forEach((item: [string, v2Types.DefinitionsHealthcheck]) => {
      const [, healthVal] = item;
      if (healthVal.test !== undefined) {
        healthcheck = healthVal;
      }
    });
  }

  let portArray: PortMappings = [];
  ports?.forEach(item => {
    //For task definitions that use the awsvpc network mode, you should only specify the containerPort.
    //The hostPort can be left blank or it must be the same value as the containerPort.
    const [containerPort, hostPort = containerPort] = item.toString().split(':');

    portArray.push({
      containerPort: parseInt(containerPort, 10),
      hostPort: parseInt(hostPort, 10),
      protocol: 'tcp',
    });
  });

  const secrets = new Set<string>();
  if (isV38Service(v)) {
    v.secrets.filter(s => typeof s === 'string').forEach(s => secrets.add(<string>s));
  }

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
    secrets,
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
    const [, v] = record;
    const { deploy } = v;

    if (deploy !== undefined) {
      // TODO: This is returning the deploy obj of the last service that had it, it should probably be an array
      result = deploy!;
    }
  });

  return result;
};

type DockerServiceInfo = {
  buildspec: string;
  service: v38Types.DefinitionsDeployment;
  containers: Container[];
  secrets: Record<string, string>;
};
export function getContainers(composeContents?: string, dockerfileContents?: string): DockerServiceInfo {
  //Step 1: Detect if there is a docker-compose or just a Dockerfile.
  //        Just Dockerfile-> create registry using function name, buildspec, zip and put on S3
  //        Compose file -> Begin by parsing it:
  const dockerCompose = composeContents ? dockerComposeToObject(composeContents) : dockerfileToObject(dockerfileContents);

  const secrets: Record<string, string> = {};

  const { secrets: composeSecrets = {} }: { secrets?: v38Types.PropertiesSecrets } = <any>dockerCompose;

  for (const secretName of Object.keys(composeSecrets)) {
    if (composeSecrets[secretName].file) {
      secrets[composeSecrets[secretName].name ?? secretName] = composeSecrets[secretName].file;
    }
  }

  //Step 2: Take compose object and pull all the containers out:
  const containers = convertDockerObjectToContainerArray(dockerCompose);

  //Step 3: Populate Build mapping for creation of the buildpsec
  const buildmapping: BuildHashMap = {};
  containers.forEach(res => {
    if (typeof res.build === 'object') {
      //console.log(res.build.args);
    }
    if (typeof res.healthcheck === 'object') {
      //console.log(res.healthcheck.command)
    }
    //Step 4: Create ECR Entry if build is specified - TODO with Francisco..... - this will go in registryArn
    if (res.build != undefined) {
      let buildContext: string = '';

      if (typeof res.build === 'object') {
        buildContext = res.build.context!;
      } else {
        buildContext = res.build;
      }

      //Wont need this if statement later, just using for testing
      /** This will look like this for each container where res.build != undefined:
       * let registryArn = new ecr.Repository(this, res.name, {});
       * buildmapping[res.name] = {buildPath: buildContext, registryArn };
       */
      buildmapping[res.name] = buildContext;
    }
  });

  //Step 5: Generate the buildfiles
  const buildspec = generateBuildSpec(buildmapping);

  const service = findServiceDeployment(dockerCompose);

  return {
    buildspec,
    service,
    containers,
    secrets,
  };
}
