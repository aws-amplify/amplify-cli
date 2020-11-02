import { stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import { pbkdf2Sync } from 'crypto';
import { Context } from '../context';
const iterations = 1000;
const length = 16;
export function createSaltedUniqueIdentifier(context: Context): string | undefined {
  try {
    const meta = stateManager.getMeta();
    const profileName = stateManager.getCurrentProfileName();
    const stackId = _.get(meta, ['providers', 'awscloudformation', 'StackId']);
    const accountId = stackId.split(':')[4];
    const pluginInstance = context.amplify.getPluginInstance(context, 'awscloudformation');
    const salt = pluginInstance.getProfileAccessKeyId(profileName);
    const buffer = pbkdf2Sync(accountId, salt, iterations, length, 'sha512');
    return buffer.toString('hex');
  } catch (ex) {
    return;
  }
}
