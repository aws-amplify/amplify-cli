import Amplify from 'aws-amplify';
import {
    CreateGroupRequest, CreateGroupResponse,
    AdminAddUserToGroupRequest, CreateUserPoolResponse,
    CreateUserPoolRequest, CreateUserPoolClientRequest,
    CreateUserPoolClientResponse, DeleteUserPoolRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider'
import {
    AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider'
import TestStorage from './TestStorage'

const cognitoClient = new CognitoClient({ apiVersion: '2016-04-19', region: 'us-west-2' })

export function configureAmplify(userPoolId: string, userPoolClientId: string) {
    Amplify.configure({
        Auth: {
            // REQUIRED - Amazon Cognito Region
            region: 'us-west-2',
            userPoolId: userPoolId,
            userPoolWebClientId: userPoolClientId,
            storage: new TestStorage()
        }
    })
}

export async function signupUser(userPoolId: string, name: string, pw: string) {
    return new Promise((res, rej) => {
        const createUser = cognitoClient.adminCreateUser.bind(cognitoClient) as any;
        createUser({
            UserPoolId: userPoolId,
            UserAttributes: [{ Name: 'email', Value: name }],
            Username: name,
            TemporaryPassword: pw
        }, (err, data) => err ? rej(err) : res(data));
    })
}

export async function authenticateUser(user: any, details: any, realPw: string) {
    return new Promise((res, rej) => {
        user.authenticateUser(details, {
            onSuccess: function (result: any) {
                res(result)
            },
            onFailure: function (err: any) {
                rej(err)
            },
            newPasswordRequired: function (userAttributes: any, requiredAttributes: any) {
                user.completeNewPasswordChallenge(realPw, user.Attributes, this)
            }
        });
    })
}

export async function signupAndAuthenticateUser(userPoolId: string, username: string, tmpPw: string, realPw: string) {
    try {
        // Sign up then login user 1.ß
        await signupUser(userPoolId, username, tmpPw)
    } catch (e) {
        console.log(`Trying to login with temp password`)
    }

    try {
        const authDetails = new AuthenticationDetails({
            Username: username,
            Password: tmpPw
        });
        const user = Amplify.Auth.createCognitoUser(username)
        const authRes = await authenticateUser(user, authDetails, realPw);
        return authRes;
    } catch (e) { console.log(`Trying to login with real password`) }

    try {
        const authDetails = new AuthenticationDetails({
            Username: username,
            Password: realPw
        });
        const user = Amplify.Auth.createCognitoUser(username)
        const authRes: any = await authenticateUser(user, authDetails, realPw);
        console.log(`Logged in ${username} \n${authRes.getIdToken().getJwtToken()}`)
        return authRes;
    } catch (e) {
        console.error(`Failed to login.\n`)
        console.error(e)
    }
}

export async function createGroup(userPoolId: string, name: string): Promise<CreateGroupResponse> {
    return new Promise((res, rej) => {
        const params: CreateGroupRequest = {
            GroupName: name,
            UserPoolId: userPoolId
        }
        cognitoClient.createGroup(params, (err, data) => err ? rej(err) : res(data))
    })
}

export async function addUserToGroup(groupName: string, username: string, userPoolId: string) {
    return new Promise((res, rej) => {
        const params: AdminAddUserToGroupRequest = {
            GroupName: groupName,
            Username: username,
            UserPoolId: userPoolId
        }
        cognitoClient.adminAddUserToGroup(params, (err, data) => err ? rej(err) : res(data))
    })
}

export async function createUserPool(client: CognitoClient, userPoolName: string): Promise<CreateUserPoolResponse> {
    return new Promise((res, rej) => {
        const params: CreateUserPoolRequest = {
            PoolName: userPoolName,
            Policies: {
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: true,
                    RequireUppercase: true,
                }
            },
            Schema: [
                {
                    Name: 'email',
                    Required: true,
                    Mutable: true
                }
            ],
            AutoVerifiedAttributes: ['email']
        }
        client.createUserPool(params, (err, data) => err ? rej(err) : res(data))
    })
}

export async function deleteUserPool(client: CognitoClient, userPoolId: string): Promise<{}> {
    return new Promise((res, rej) => {
        const params: DeleteUserPoolRequest = {
            UserPoolId: userPoolId
        }
        client.deleteUserPool(params, (err, data) => err ? rej(err) : res(data))
    })
}

export async function createUserPoolClient(client: CognitoClient, userPoolId: string, clientName: string): Promise<CreateUserPoolClientResponse> {
    return new Promise((res, rej) => {
        const params: CreateUserPoolClientRequest = {
            ClientName: clientName,
            UserPoolId: userPoolId,
            GenerateSecret: false,
            RefreshTokenValidity: 30
        };
        client.createUserPoolClient(params, (err, data) => err ? rej(err) : res(data))
    })
}