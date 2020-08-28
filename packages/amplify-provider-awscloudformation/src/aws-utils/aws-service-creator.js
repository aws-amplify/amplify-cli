const { loadConfiguration } = require('../../lib/configuration-manager');
const { logger } = require('amplify-cli-logger');
export async function CreateService(context, service, options = {}, cred) {
  let credentials = {};
  if (cred) {
    try {
      credentials = await loadConfiguration(context);
    } catch (ex) {
      // ignore missing config
    }
  } else {
    credentials = cred;
  }
  const instance = new service({ ...options, ...credentials });
  return instance;
}
