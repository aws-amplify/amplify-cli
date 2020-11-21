import { ListOrDict } from '../compose-spec/v2';

export interface IServiceDefinition {
  containers: IContainerDefinitions[];
  cpu?: number | string;
  memory?: number | string;
  tags?: string[];
}

export type ContainerHealthCheck = {
  command?: string[];
  interval?: number;
  retries?: number;
  start_period?: number;
  timeout?: number;
};

export interface IContainerDefinitions {
  build: string | IBuildConfig | undefined;
  image?: string;
  name: string;
  // entrypoint?: string | string[] | undefined;
  logConfiguration: ILogConfiguration;
  portMappings: PortMappings;

  command?: string[] | undefined;
  entrypoint?: string[] | undefined;
  env_file?: string[] | undefined;
  environment?: Record<string, string> | undefined;
  // image?: string | undefined;
  healthcheck?: ContainerHealthCheck;
  working_dir?: string;
  user?: string;
}

export interface ILogConfiguration {
  logDriver: string;
  options: {
    'awslogs-stream-prefix': string;
  };
}

export interface IBuildConfig {
  context?: string;
  dockerfile?: string;
  args?: ListOrDict;
}

export type PortMappings = IPortMappingItem[];

interface IPortMappingItem {
  containerPort: number;
  hostPort?: number;
  protocol: string;
}

export interface IContainerHealthCheckItem {
  command?: string | string[];
  interval?: number | string;
  retries?: number;
  start_period?: string;
  timeout?: string;
}

export type ServiceHealthCheck = IALBHealthCheckItem;

interface IALBHealthCheckItem {
  path: string;
  port: number;
}

export type DeploymentConfiguration = IDeploymentConfiguration;

interface IDeploymentConfiguration {
  MaximumPercent: number;
  MinimumHealthyPercent: number;
}

export type TaskConfig = ITaskConfig;

interface ITaskConfig {
  memory: number;
  vCPU: number;
}

export type ContainerConfig = IContainerConfig;

interface IContainerConfig {
  memory: number;
  cpu: number;
}

export type BuildHashMap = Record<string, string>;
