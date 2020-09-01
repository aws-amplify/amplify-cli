import * as fs from 'fs-extra';
import uuid from 'uuid';
import _ from 'lodash';
import { JSONUtilities } from 'amplify-cli-core';

import { Context } from '../domain/context';
import { getPath } from './getPath';

export function init(context: Context) {
  const configPath = getPath(context);
  if (fs.existsSync(configPath)) {
    try {
      const savedConfig = JSONUtilities.readJson(configPath);
      Config.Instance.setValues(savedConfig);
      return getConfig();
    } catch (ex) {
      context.print.warning('Corrupted Config generating new config');
    }
  }
  write(context, Config.Instance);
  return getConfig();
}

export function getConfig() {
  return Config.Instance;
}

export function write(context: Context, keyValues: Object) {
  Config.Instance.setValues(keyValues);

  JSONUtilities.writeJson(getPath(context), Config.Instance);
}

class Config {
  usageDataConfig: UsageDataConfig;

  private static instance: Config;

  public static get Instance(): Config {
    if (!this.instance) {
      this.instance = new Config();
    }

    return this.instance;
  }

  private constructor() {
    this.usageDataConfig = new UsageDataConfig();
  }

  setValues(keyValues: any) {
    Config.instance = _.merge(Config.instance, keyValues);
  }
}

class UsageDataConfig {
  installationUuid: String;
  isUsageTrackingEnabled: boolean;

  constructor() {
    this.installationUuid = uuid.v4();
    this.isUsageTrackingEnabled = true;
  }
}
