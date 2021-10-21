import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';

export interface ApiArtifactHandlerOptions {
  skipCompile?: boolean;
}

export interface ApiArtifactHandler {
  createArtifacts(request: AddApiRequest): Promise<string>;
  updateArtifacts(request: UpdateApiRequest, opts?: ApiArtifactHandlerOptions): Promise<void>;
}
