import type AWS from "aws-sdk";
import aws from './aws';
import configurationManager from "../configuration-manager";

class ECR {
  public ecr: AWS.ECR;

  constructor(private readonly context: any, options = {}) {
    const instancePromise = (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      this.ecr = new (aws as typeof AWS).ECR({ ...cred, ...options });

      return this;
    })();

    return <ECR><unknown>instancePromise;
  }
}

module.exports = ECR;
