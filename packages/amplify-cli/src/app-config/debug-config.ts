import _ from 'lodash';
import {
  $TSAny, DebugConfigValueNotSetError, NotInitializedError, pathManager, stateManager,
} from 'amplify-cli-core';

/**
 * Singleton class to handle debug values
 */
export class DebugConfig {
  private static instance: DebugConfig;
  private debug : DebugConfigType
  private dirty: boolean
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
      shareProjectConfig: _.get(cliJson, ['debug', 'shareProjectConfig'])
    };
    this.dirty = false;
  }

  // eslint-disable-next-line class-methods-use-this
  private getCLIJson(throwIfNotExist: boolean = true): $TSAny {
    const rootPath = pathManager.findProjectRoot();
    if (!rootPath) {
      if(!throwIfNotExist) {
        return {}
      }
      throw new NotInitializedError();
    }

    const cliJson = stateManager.getCLIJSON(rootPath, undefined, { throwIfNotExist });
    return cliJson;
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
      throw new NotInitializedError();
    }
    const cliJson = this.getCLIJson();
    if (!cliJson) {
      return;
    }
    const updatedCliJson = _.set(cliJson, [], this.debug);
    stateManager.setCLIJSON(rootPath, { ...updatedCliJson, debug: this.debug });
    this.dirty = false;
  }

  /**
   * Gets the flag, throws error if not written to file
   */
  getCanSendReport() : boolean {
    if (this.dirty) {
      throw new DebugConfigValueNotSetError();
    }

    return this.debug.shareProjectConfig === true;
  }

  /**
   * return boolean if a prompt is required to get consent
   */
  promptSendReport() : boolean {
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
   shareProjectConfig: boolean | undefined
 }
 