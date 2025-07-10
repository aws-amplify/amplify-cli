import {
  addAuthWithGroupsAndAdminAPI,
  addUserToGroup,
  amplifyPushAuth,
  configureAmplify,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getUserPoolId,
  initJSProjectWithProfile,
  invokeFunction,
  setupUser,
} from '@aws-amplify/amplify-e2e-core';
import { $TSAny } from '@aws-amplify/amplify-cli-core';

describe('auth admin api tests', () => {
  let projRoot: string;
  let adminLambdaName: string;
  let adminLambdaRegion: string;

  const callAdminLambda = async (request: $TSAny): Promise<$TSAny> => {
    if (!request.requestContext) {
      // Mock authorization necessary for admin API
      request.requestContext = {
        authorizer: {
          claims: {
            'cognito:groups': 'Admins',
          },
        },
      };
    }
    const lambdaResponse = await invokeFunction(adminLambdaName, JSON.stringify(request), adminLambdaRegion);
    return JSON.parse(lambdaResponse.Payload.toString());
  };

  beforeAll(async () => {
    projRoot = await createNewProjectDir('auth');
    await initJSProjectWithProfile(projRoot);
    await addAuthWithGroupsAndAdminAPI(projRoot);
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const adminLambdaOutputs = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
    adminLambdaName = adminLambdaOutputs.Name;
    adminLambdaRegion = adminLambdaOutputs.Region;

    const userPoolId = getUserPoolId(projRoot);
    await configureAmplify(projRoot);

    for (let i = 0; i < 5; i++) {
      const username = `testUser${i}`;
      const password = `Password12#${i}`;
      await setupUser(userPoolId, username, password, 'Users', adminLambdaRegion);
    }

    for (let i = 0; i < 5; i++) {
      const username = `testAdminUser${i}`;
      const password = `Password12#${i}`;
      await setupUser(userPoolId, username, password, 'Admins', adminLambdaRegion);
      await addUserToGroup(userPoolId, username, 'Users', adminLambdaRegion);
    }
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('can list groups', async () => {
    const request = {
      path: '/listGroups',
      httpMethod: 'GET',
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Groups.length).toBe(2);
  });

  it('can list groups with limit', async () => {
    const request = {
      path: '/listGroups',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: '1',
      },
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Groups.length).toBe(1);
  });

  it('can list users', async () => {
    const request = {
      path: '/listUsers',
      httpMethod: 'GET',
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Users.length).toBe(10);
  });

  it('can list users with limit', async () => {
    const request = {
      path: '/listUsers',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: '1',
      },
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Users.length).toBe(1);
  });

  it('can list users in group', async () => {
    const request = {
      path: '/listUsersInGroup',
      httpMethod: 'GET',
      queryStringParameters: {
        groupname: 'Admins',
      },
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Users.length).toBe(5);
  });

  it('can list users in group with limit', async () => {
    const request = {
      path: '/listUsersInGroup',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: '1',
        groupname: 'Admins',
      },
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Users.length).toBe(1);
  });

  it('can list groups for user', async () => {
    const request = {
      path: '/listGroupsForUser',
      httpMethod: 'GET',
      queryStringParameters: {
        username: 'testAdminUser1',
      },
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Groups.length).toBe(2);
  });

  it('can list groups for user with limit', async () => {
    const request = {
      path: '/listGroupsForUser',
      httpMethod: 'GET',
      queryStringParameters: {
        limit: '1',
        username: 'testAdminUser1',
      },
    };
    const response = await callAdminLambda(request);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.Groups.length).toBe(1);
  });
});
