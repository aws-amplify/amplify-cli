import _ from 'lodash';
import { $TSAny, DebugConfigValueNotSetError, projectNotInitializedError, pathManager, stateManager } from 'amplify-cli-core';

/**
 * Singleton class to handle debug values
 */
export class DebugConfig {
  private static instance: DebugConfig;
  private debug: DebugConfigType;
  private dirty: boolean;
  /**
   * Static instance
   */
  public static get Instance(): DebugConfig {
    if (!this.instance) {
      this.instance = new DebugConfig();
    }

    return this.instance;
  }

  private constructor() {
    const cliJson = this.getCLIJson(false);
    this.debug = {
      shareProjectConfig: _.get(cliJson, ['debug', 'shareProjectConfig']),
    };
    this.dirty = false;
  }

  // eslint-disable-next-line class-methods-use-this
  private getCLIJson(throwIfNotExist = true): $TSAny {
    const rootPath = pathManager.findProjectRoot();
    if (!rootPath) {
      if (!throwIfNotExist) {
        return {};
      }
      throw projectNotInitializedError();
    }

    return stateManager.getCLIJSON(rootPath, undefined, { throwIfNotExist });
  }

  /**
   * Sets flag in memory, don't call get without writing it the file
   */
  setShareProjectConfig(shareProjectConfig: boolean | undefined): void {
    this.debug = {
      shareProjectConfig,
    };
    this.dirty = true;
  }

  /**
   * Writes the in memory flag to cli.json
   */
  writeShareProjectConfig(): void {
    const rootPath = pathManager.findProjectRoot();
    if (!rootPath) {
      throw projectNotInitializedError();
    }
    const cliJson = this.getCLIJson(false);
    if (!cliJson) {
      return;
    }
    const updatedCliJson = _.setWith(cliJson, [], this.debug);
    stateManager.setCLIJSON(rootPath, { ...updatedCliJson, debug: this.debug });
    this.dirty = false;
  }

  /**
   * Gets the flag, throws error if not written to file
   */
  getCanSendReport(): boolean {
    if (this.dirty) {
      throw new DebugConfigValueNotSetError();
    }

    return this.debug.shareProjectConfig === true;
  }

  /**
   * return boolean if a prompt is required to get consent
   */
  promptSendReport(): boolean {
    if (this.dirty) {
      throw new DebugConfigValueNotSetError();
    }
    return this.debug.shareProjectConfig === undefined;
  }

  /**
   * sets in memory flag and writes to cli.json
   */
  setAndWriteShareProject(shareProjectConfig: boolean | undefined): void {
    this.setShareProjectConfig(shareProjectConfig);
    this.writeShareProjectConfig();
  }
}

type DebugConfigType = {
  shareProjectConfig: boolean | undefined;
};
