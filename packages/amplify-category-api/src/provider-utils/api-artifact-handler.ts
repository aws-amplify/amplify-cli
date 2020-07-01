import { AddApiRequest } from 'amplify-headless-interface';

export interface ApiArtifactHandler {
  createArtifacts(request: AddApiRequest): Promise<string>;
}
