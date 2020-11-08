import { IContainerDefinitions, PortMappings, IBuildConfig, ContainerHealthCheck } from './types';
import { ListOrDict } from '../compose-spec/v1';

class Container implements IContainerDefinitions {
  readonly defaultLogConfiguration = {
    logDriver: 'awslogs',
    options: {
      awslogs_group: '/ecs/fargate-task-definition', //change _ to - later
      awslogs_region: 'us-east-1',
      awslogs_stream_prefix: 'ecs',
    },
  };

  build: string | IBuildConfig | undefined;
  name: string;
  portMappings: PortMappings;
  logConfiguration = this.defaultLogConfiguration;

  command?: string | string[] | undefined;
  entrypoint?: string | string[] | undefined;
  env_file?: string | string[] | undefined;
  environment?: ListOrDict | undefined;
  image?: string | undefined;
  healthcheck?: ContainerHealthCheck;
  working_dir?: string | undefined;
  user?: string | undefined;

  constructor(
    build: string | IBuildConfig | undefined, //Really for CodeBuild. Do we need in this class?
    name: string,
    portMappings: PortMappings,
    command?: string | string[] | undefined,
    entrypoint?: string | string[] | undefined,
    env_file?: string | string[] | undefined,
    environment?: ListOrDict | undefined,
    image?: string | undefined,
    healthcheck?: ContainerHealthCheck | undefined,
    working_dir?: string | undefined,
    user?: string | undefined,
  ) {
    this.build = build;
    this.name = name;
    this.portMappings = portMappings;
    this.command = command;
    this.entrypoint = entrypoint;
    this.env_file = env_file;
    this.environment = environment;
    this.image = image;
    this.healthcheck = healthcheck;
    this.working_dir = working_dir;
    this.user = user;
  }
}

export default Container;
