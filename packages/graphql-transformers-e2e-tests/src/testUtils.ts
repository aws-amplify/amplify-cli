import * as CognitoClient from 'aws-sdk/clients/cognitoidentityserviceprovider'
import {
    CreateUserPoolResponse, CreateUserPoolRequest, CreateUserPoolClientRequest, CreateUserPoolClientResponse,
    DeleteUserPoolRequest,
} from 'aws-sdk/clients/cognitoidentityserviceprovider'

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