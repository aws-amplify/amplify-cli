import { $TSContext, $TSObject, AmplifyCategories, ResourceDoesNotExistError } from "amplify-cli-core";
import { ICognitoUserPoolService } from "amplify-util-import";
import { IdentityProviderType } from "aws-sdk/clients/cognitoidentityserviceprovider";
import { createOAuthCredentials } from "../import";

export const getOAuthObjectFromCognito = async (context: $TSContext, userPoolName : string): Promise<string> => {
    const cognito = await context.amplify.invokePluginMethod(context, AmplifyCategories.AWSCLOUDFORMATION,undefined,'createCognitoUserPoolService',[
        context,
    ]) as ICognitoUserPoolService;
    const userPool = (await cognito.listUserPools()).filter(userPool => userPool.Name === userPoolName)[0];
    if(userPool){
        const identityProviders: IdentityProviderType[] = await cognito.listUserPoolIdentityProviders(userPool.Id!);
        return createOAuthCredentials(identityProviders);
    }
    else{
        const errMessage = 'No auth resource found. Add it using amplify add auth';
        throw new ResourceDoesNotExistError(errMessage);
    }
}