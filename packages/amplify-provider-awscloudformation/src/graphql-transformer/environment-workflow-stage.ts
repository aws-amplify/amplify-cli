export const getEnvironmentWorkflowStage = (): EnvironmentWorkflowStage => EnvironmentWorkflowStage.DEVELOPMENT;

export enum EnvironmentWorkflowStage {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
}
