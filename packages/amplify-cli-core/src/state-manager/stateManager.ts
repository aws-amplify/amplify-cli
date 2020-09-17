import * as fs from 'fs-extra';
import { pathManager } from './pathManager';
import { $TSMeta, $TSTeamProviderInfo, $TSAny } from '..';
import { JSONUtilities } from '../jsonUtilities';
import { Tag, ReadValidateTags } from '../tags';

export type GetOptions<T> = {
  throwIfNotExist?: boolean;
  preserveComments?: boolean;
  default?: T;
};

export class StateManager {
  metaFileExists = (projectPath?: string): boolean => fs.existsSync(pathManager.getAmplifyMetaFilePath(projectPath));

  getMeta = (projectPath?: string, options?: GetOptions<$TSMeta>): $TSMeta => {
    const filePath = pathManager.getAmplifyMetaFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    const data = this.getData<$TSMeta>(filePath, mergedOptions);

    return data;
  };

  currentMetaFileExists = (projectPath?: string): boolean => fs.existsSync(pathManager.getCurrentAmplifyMetaFilePath(projectPath));

  getCurrentMeta = (projectPath?: string, options?: GetOptions<$TSMeta>): $TSMeta => {
    const filePath = pathManager.getCurrentAmplifyMetaFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    const data = this.getData<$TSMeta>(filePath, mergedOptions);

    return data;
  };

  getProjectTags = (projectPath?: string): Tag[] => ReadValidateTags(pathManager.getTagFilePath(projectPath));

  getCurrentProjectTags = (projectPath?: string): Tag[] => ReadValidateTags(pathManager.getCurrentTagFilePath(projectPath));

  teamProviderInfoExists = (projectPath?: string): boolean => fs.existsSync(pathManager.getTeamProviderInfoFilePath(projectPath));

  getTeamProviderInfo = (projectPath?: string, options?: GetOptions<$TSTeamProviderInfo>): $TSTeamProviderInfo => {
    const filePath = pathManager.getTeamProviderInfoFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSTeamProviderInfo>(filePath, mergedOptions);
  };

  localEnvInfoExists = (projectPath?: string): boolean => fs.existsSync(pathManager.getLocalEnvFilePath(projectPath));

  getLocalEnvInfo = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getLocalEnvFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  getLocalAWSInfo = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getLocalAWSInfoFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  projectConfigExists = (projectPath?: string): boolean => fs.existsSync(pathManager.getProjectConfigFilePath(projectPath));

  getProjectConfig = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getProjectConfigFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  backendConfigFileExists = (projectPath?: string): boolean => fs.existsSync(pathManager.getBackendConfigFilePath(projectPath));

  getBackendConfig = (projectPath?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getBackendConfigFilePath(projectPath);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  setLocalEnvInfo = (projectPath: string | undefined, localEnvInfo: $TSAny): void => {
    const filePath = pathManager.getLocalEnvFilePath(projectPath);

    JSONUtilities.writeJson(filePath, localEnvInfo);
  };

  setLocalAWSInfo = (projectPath: string | undefined, localAWSInfo: $TSAny): void => {
    const filePath = pathManager.getLocalAWSInfoFilePath(projectPath);

    JSONUtilities.writeJson(filePath, localAWSInfo);
  };

  setProjectFileTags = (projectPath: string | undefined, tags: Tag[]): void => {
    const tagFilePath = pathManager.getTagFilePath(projectPath);
    JSONUtilities.writeJson(tagFilePath, tags);
  };

  setProjectConfig = (projectPath: string | undefined, projectConfig: $TSAny): void => {
    const filePath = pathManager.getProjectConfigFilePath(projectPath);

    JSONUtilities.writeJson(filePath, projectConfig);
  };

  setTeamProviderInfo = (projectPath: string | undefined, teamProviderInfo: $TSTeamProviderInfo): void => {
    const filePath = pathManager.getTeamProviderInfoFilePath(projectPath);

    JSONUtilities.writeJson(filePath, teamProviderInfo);
  };

  setBackendConfig = (projectPath: string | undefined, backendConfig: $TSAny): void => {
    const filePath = pathManager.getBackendConfigFilePath(projectPath);

    JSONUtilities.writeJson(filePath, backendConfig);
  };

  setMeta = (projectPath: string | undefined, meta: $TSMeta): void => {
    const filePath = pathManager.getAmplifyMetaFilePath(projectPath);

    JSONUtilities.writeJson(filePath, meta);
  };

  setCurrentMeta = (projectPath: string | undefined, meta: $TSMeta): void => {
    const filePath = pathManager.getCurrentAmplifyMetaFilePath(projectPath);

    JSONUtilities.writeJson(filePath, meta);
  };

  cliJSONFileExists = (projectPath: string, env?: string): boolean => fs.existsSync(pathManager.getCLIJSONFilePath(projectPath, env));

  getCLIJSON = (projectPath: string, env?: string, options?: GetOptions<$TSAny>): $TSAny => {
    const filePath = pathManager.getCLIJSONFilePath(projectPath, env);
    const mergedOptions = {
      throwIfNotExist: true,
      ...options,
    };

    return this.getData<$TSAny>(filePath, mergedOptions);
  };

  setCLIJSON = (projectPath: string, cliJSON: any, env?: string): void => {
    const filePath = pathManager.getCLIJSONFilePath(projectPath, env);

    JSONUtilities.writeJson(filePath, cliJSON, {
      keepComments: true,
    });
  };

  private getData = <T>(filePath: string, options?: GetOptions<T>): T | undefined => {
    const data = JSONUtilities.readJson<T>(filePath, {
      throwIfNotExist: options?.throwIfNotExist ?? true,
    });

    return data ?? options?.default;
  };
}

export const stateManager = new StateManager();
