import AWS from 'aws-sdk';
import aws from './aws';
import { loadConfiguration } from '../configuration-manager';
import { $TSContext } from 'amplify-cli-core';

export class AmplifyBackend {
  public amplifyBackend: AWS.AmplifyBackend;

  constructor(private readonly context: $TSContext, options = {}) {
    const instancePromise = (async () => {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      this.amplifyBackend = new (aws as typeof AWS).AmplifyBackend({ ...cred, ...options });

      return this;
    })();

    return <AmplifyBackend>(<unknown>instancePromise);
  }
}
