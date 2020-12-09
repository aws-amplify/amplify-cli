import { IContainerDefinitions, PortMappings, IBuildConfig, ContainerHealthCheck, IContainerHealthCheckItem } from './types';
import { ListOrDict } from '../compose-spec/v1';

class Container implements IContainerDefinitions {
  readonly defaultLogConfiguration = {
    logDriver: 'awslogs',
    options: {
      'awslogs-stream-prefix': 'ecs', // use cluster name
    },
  };

  build: string | IBuildConfig | undefined;
  name: string;
  portMappings: PortMappings;
  logConfiguration = this.defaultLogConfiguration;

  command?: string[];
  entrypoint?: string[];
  env_file?: string[];
  environment?: Record<string, string>;
  image?: string;
  healthcheck?: ContainerHealthCheck;
  working_dir?: string;
  user?: string;
  secrets: Set<string>;

  constructor(
    build: string | IBuildConfig | undefined, //Really for CodeBuild. Do we need in this class?
    name: string,
    portMappings: PortMappings,
    command?: string | string[] | undefined,
    entrypoint?: string | string[] | undefined,
    env_file?: string | string[] | undefined,
    environment?: ListOrDict | undefined,
    image?: string | undefined,
    healthcheck?: IContainerHealthCheckItem | undefined,
    working_dir?: string | undefined,
    user?: string | undefined,
    secrets?: Set<string> | undefined,
  ) {
    this.build = build;
    this.name = name;
    this.portMappings = portMappings;
    this.command = [].concat(command);
    this.entrypoint = [].concat(entrypoint);
    this.env_file = [].concat(env_file);
    this.environment = Array.isArray(environment)
      ? environment.reduce((acc, element) => {
          const [key, value] = element.split('=');

          acc[key] = value;
          return acc;
        }, {} as Record<string, string>)
      : (environment as Record<string, string>);
    this.image = image;

    this.healthcheck = (({ interval, command, start_period, timeout, retries }) =>
      command
        ? {
            interval: toSeconds(interval),
            command: [].concat(command),
            start_period: toSeconds(start_period),
            timeout: toSeconds(timeout),
            retries,
          }
        : undefined)(healthcheck);

    this.working_dir = working_dir;
    this.user = user;
    this.secrets = secrets ?? new Set();
  }
}

function toSeconds(str: string | number): number {
  const [, seconds] = `${str}`.match(/^(\d+)s\s*$/) || [];

  if (seconds === undefined) {
    return undefined;
  }

  return parseInt(seconds, 10);
}

export default Container;
