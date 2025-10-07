import { $TSContext } from '@aws-amplify/amplify-cli-core';

export const run = async (context: $TSContext): Promise<void> => {
  return new AmplifyDriftDetector(context).detect();
};

export class AmplifyDriftDetector {
  constructor(private readonly context: $TSContext) {}

  public async detect(): Promise<void> {
    throw new Error('Not implemented');
  }
}
