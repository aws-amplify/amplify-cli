import {
  addFunction,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  createNewDynamoDBForCrudTemplate,
  amplifyPushAuth,
  functionCloudInvoke,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';

describe('nodejs', () => {
  describe('amplify add crud function', () => {
    let projRoot: string;
    let funcName: string;
    beforeEach(async () => {
      projRoot = await createNewProjectDir('nodejs-crud-fn');
      funcName = `nodejstestfn${generateRandomShortId()}`;
    });

    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });

    it('add nodejs crud function and invoke in the cloud', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addFunction(
        projRoot,
        {
          name: funcName,
          functionTemplate: 'CRUD function for DynamoDB (Integration with API Gateway)',
        },
        'nodejs',
        createNewDynamoDBForCrudTemplate,
      );

      await amplifyPushAuth(projRoot);

      const item1 = {
        column1: 'column1val1',
        column2: 'column2val1',
      };

      const item2 = {
        column1: 'column1val2',
        column2: 'column2val2',
      };

      let response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          body: JSON.stringify(item1),
          path: '/item',
          httpMethod: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
      expect(JSON.parse(response.Payload.transformToString()).body).toContain('post call succeed!');

      response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          body: JSON.stringify(item2),
          path: '/item',
          httpMethod: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
      expect(JSON.parse(response.Payload.transformToString()).body).toContain('post call succeed!');

      response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          body: JSON.stringify(item2),
          path: '/item',
          httpMethod: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
      expect(JSON.parse(response.Payload.transformToString()).body).toContain('put call succeed!');

      response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          path: `/item/${item1.column1}`,
          httpMethod: 'GET',
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
      expect(JSON.parse(JSON.parse(response.Payload.transformToString()).body)).toEqual([item1]);

      response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          path: `/item/object/${item2.column1}/${item2.column2}`,
          httpMethod: 'GET',
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
      expect(JSON.parse(JSON.parse(response.Payload.transformToString()).body)).toEqual(item2);

      response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          path: '/item',
          httpMethod: 'GET',
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
      expect(JSON.parse(JSON.parse(response.Payload.transformToString()).body)).toContainEqual(item1);
      expect(JSON.parse(JSON.parse(response.Payload.transformToString()).body)).toContainEqual(item2);

      response = await functionCloudInvoke(projRoot, {
        funcName,
        payload: JSON.stringify({
          path: `/item/object/${item2.column1}/${item2.column2}`,
          httpMethod: 'DELETE',
        }),
      });
      expect(JSON.parse(response.Payload.transformToString()).statusCode).toEqual(200);
    });
  });
});
