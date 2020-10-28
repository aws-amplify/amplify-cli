import url from 'url';
import path from 'path';
import fs from 'fs-extra';
import { post } from '../utils/request';

export async function appsyncGraphQLRequest(resource: { [id: string]: any }, op: { query: string; variables: string | null }) {
  const postData = JSON.stringify(op);
  const target = url.parse(resource.output.GraphQLAPIEndpointOutput);
  return await post({
    body: postData,
    hostname: target.host,
    path: target.path,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length,
      'X-Api-Key': resource.output.GraphQLAPIKeyOutput,
    },
  });
}

export const getProjectSchema = (projRoot: string, apiName: string) => {
  const schemaFilePath = path.join(projRoot, 'amplify', 'backend', 'api', apiName, 'schema.graphql');
  return fs.readFileSync(schemaFilePath, 'utf8');
};
