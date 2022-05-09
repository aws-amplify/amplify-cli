import * as fs from 'fs-extra';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { $TSAny, DebugConfigValueNotSetError, NotInitializedError, pathManager, stateManager } from 'amplify-cli-core';

export class DebugConfig {

  private static instance: DebugConfig;
  private debug : DebugConfigType
  private dirty: boolean
  public static get Instance(): DebugConfig {
    if (!this.instance) {
      this.instance = new DebugConfig();
    }

    return this.instance;
  }
  
  private constructor() {
    this.debug = {
      shareProjectConfig: undefined
    }
    this.dirty = false;
  }




  private getCLIJson(): $TSAny {
    const rootPath = pathManager.findProjectRoot();
    if(!rootPath){
        throw new NotInitializedError();
    }

    const cliJson = stateManager.getCLIJSON(rootPath)
    return cliJson;

  }

  
  setShareProjectConfig(shareProjectConfig: boolean | undefined): void {
    this.debug =  {
      shareProjectConfig,
    }
    this.dirty = true;
  }

  writeShareProjectConfig(): void {
      const rootPath = pathManager.findProjectRoot();
      if(!rootPath){
          throw new NotInitializedError();
      }
      const cliJson = this.getCLIJson();
      if(!cliJson) {
          return;
      }
      const updatedCliJson = _.set(cliJson, [], this.debug)
      stateManager.setCLIJSON(rootPath, {...updatedCliJson, debug: this.debug});
      this.dirty = false;
  }

  getCanSendReport() : boolean {
    if(this.dirty) {
      throw new DebugConfigValueNotSetError();
    }

    return this.debug.shareProjectConfig === true;
  }

  promptSendReport() : boolean {
    if(this.dirty) {
      throw new DebugConfigValueNotSetError();
    }
    return this.debug.shareProjectConfig === undefined
  }

  setAndWriteShareProject(shareProjectConfig: boolean | undefined){
    this.setShareProjectConfig(shareProjectConfig);
    this.writeShareProjectConfig()
  }

 }

 type DebugConfigType = {
   shareProjectConfig: boolean | undefined
 }


