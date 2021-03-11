import AWS from 'aws-sdk';
import aws from './aws';
import { loadConfiguration } from '../configuration-manager';
import { $TSContext } from 'amplify-cli-core';

export class STS {
  public sts: AWS.STS;

  constructor(private readonly context: $TSContext, options = {}) {
    const instancePromise = (async () => {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      this.sts = new (aws as typeof AWS).STS({ ...cred, ...options });

      return this;
    })();

    return <STS>(<unknown>instancePromise);
  }
}
