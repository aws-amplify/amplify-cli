import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';

export interface ApiArtifactHandler {
  createArtifacts(request: AddApiRequest): Promise<string>;
  updateArtifacts(request: UpdateApiRequest): Promise<void>;
}
