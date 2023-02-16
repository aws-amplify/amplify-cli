/**
 * Defines acceptable payloads to amplify import auth --headless.
 */
export interface ImportAuthRequest {
    /**
     * The schema version.
     */
    version: 1;

    /**
     * The id of the Cognito User Pool
     */
    userPoolId: string;

    /**
     * The id of the Cognito Web Client
     */
    webClientId: string;

    /**
     * The id of the Cognito Native Client
     */
    nativeClientId: string;
    /**
     * The id of the Cognito Identity Pool
     */
    identityPoolId?: string;
}
