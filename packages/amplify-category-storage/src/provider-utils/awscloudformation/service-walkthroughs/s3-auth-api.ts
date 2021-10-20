import { $TSAny, $TSContext } from "amplify-cli-core";
import { S3UserInputs } from "../service-walkthrough-types/s3-user-input-types";
import { S3InputState } from "./s3-user-input-state";

/* This file contains all functions interacting with AUTH category */

//UPSTREAM API: function to be called from Storage to fetch or update Auth resources
export  async function getAuthResourceARN( context : $TSContext ) : Promise<string> {
    let authResources = (await context.amplify.getResourceStatus('auth')).allResources;
    authResources = authResources.filter((resource: $TSAny) => resource.service === 'Cognito');
    if (authResources.length === 0) {
      throw new Error('No auth resource found. Please add it using amplify add auth');
    }
    return authResources[0].resourceName as string;
}
