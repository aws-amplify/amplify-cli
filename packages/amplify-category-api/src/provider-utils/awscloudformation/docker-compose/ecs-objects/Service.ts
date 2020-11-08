import { IServiceDefinition, ServiceHealthCheck, DeploymentConfiguration, ContainerConfig, TaskConfig } from './types';
import Container from './Container';
import * as v38Types from '../compose-spec/v3.8';

//ALB Healthcheck, should be overriden by CLI command
const DEFAULT_API_HEALTHCHECK = {
  path: '/',
  port: 443,
};

/*This will ensure that there is always at least 1 task running during deployment
 */
const DEFAULT_SERVICE_DEPLYMENT_CONFIG = {
  MaximumPercent: 200,
  MinimumHealthyPercent: 100,
};
const DEFAULT_DESIRED_COUNT = 1; //Should this be 3?

const DEFAULT_TASK_MEMORY_CPU = {
  memory: 1, //In GB: .5, 1, 2, ...6
  vCPU: 1, //0.25, .5, 1, 2, ...4
};

const DEFAULT_CONTAINER_MEMORY_MAX = 1024;
const DEFAULT_CPU_UNIT_RESERVATION = DEFAULT_CONTAINER_MEMORY_MAX * 0.1; //Do we even need this?
const DEFAULT_CONTAINER_MEMORY_CPU = {
  memory: DEFAULT_CONTAINER_MEMORY_MAX,
  cpu: DEFAULT_CPU_UNIT_RESERVATION,
};

class Service implements IServiceDefinition {
  containers: Container[] = [];
  apiHealthcheck?: ServiceHealthCheck;
  taskResources: TaskConfig = DEFAULT_TASK_MEMORY_CPU;
  containerResources: ContainerConfig = DEFAULT_CONTAINER_MEMORY_CPU;
  deploymentConfiguration: DeploymentConfiguration = DEFAULT_SERVICE_DEPLYMENT_CONFIG;
  desiredCount: number = DEFAULT_DESIRED_COUNT;

  constructor(
    containers: Container[],
    apiHealthcheck: ServiceHealthCheck = DEFAULT_API_HEALTHCHECK,
    dockerDeploymentConfig?: v38Types.DefinitionsDeployment2,
  ) {
    containers.forEach(instance => {
      this.containers.push(instance);
    });

    this.apiHealthcheck = apiHealthcheck; //Potentially exposed via CLI inputs, not Docker Compose

    //Docker compose optional inputs//

    /*SERVICE-specific settings*/
    dockerDeploymentConfig?.replicas !== undefined && (this.desiredCount = dockerDeploymentConfig?.replicas); //Main control, replica ~= task count

    //TODO - Need to look deeper at this algorithm
    dockerDeploymentConfig?.placement?.max_replicas_per_node !== undefined &&
      (this.deploymentConfiguration.MaximumPercent = dockerDeploymentConfig?.placement?.max_replicas_per_node);

    //Maybe something like this?
    // if (dockerDeploymentConfig?.placement?.max_replicas_per_node !== undefined) {
    //   let calc = 100 + ((dockerDeploymentConfig?.placement?.max_replicas_per_node / this.desiredCount) * 100);
    //   console.log(calc);
    // }

    /*CONTAINER-specific settings*/
    //ECS recommends 300-500 MiB as a starting point for web applications.
    dockerDeploymentConfig?.resources?.limits?.memory !== undefined &&
      (this.containerResources.memory = (dockerDeploymentConfig?.resources?.limits?.memory.slice(0, -1) as unknown) as number);

    //Note: when you don’t specify any CPU units for a container
    //ECS intrinsically enforces two Linux CPU shares for the cgroup (which is the minimum allowed).
    dockerDeploymentConfig?.resources?.limits?.cpus !== undefined &&
      (this.containerResources.cpu = dockerDeploymentConfig?.resources?.reservations?.cpus as number);
  }
}

export default Service;
