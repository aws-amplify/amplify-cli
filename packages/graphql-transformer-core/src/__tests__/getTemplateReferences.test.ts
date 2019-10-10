import { getTemplateReferences } from '../util/getTemplateReferences';
import { Template, Fn, AppSync, DynamoDB } from 'cloudform-types';

const template: Template = {
  Parameters: {
    IsProd: {
      Type: 'String',
      Default: 'prod',
    },
  },
  Conditions: {
    IsProd: Fn.Equals(Fn.Ref('env'), 'prod'),
  },
  Resources: {
    API: new AppSync.GraphQLApi({
      Name: 'My AppSync API',
      AuthenticationType: 'API_KEY',
    }),
    PostTableDataSource: new AppSync.DataSource({
      ApiId: Fn.Ref('API'),
      Name: 'PostDataSource',
      Type: 'AMAZON_DYNAMODB',
    }),
    PostTable: new DynamoDB.Table({
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    }),
    CreatePostResolver: new AppSync.Resolver({
      ApiId: Fn.Ref('API'),
      DataSourceName: Fn.GetAtt('PostTableDataSource', 'name'),
      FieldName: 'createPost',
      TypeName: 'Mutation',
    }),
    UpdatePostResolver: new AppSync.Resolver({
      ApiId: Fn.Ref('API'),
      DataSourceName: Fn.Join(':', [Fn.Ref('PostTable'), Fn.Join(':', [Fn.GetAtt('PostTableDataSource', 'name')])]),
      // Contrived examples for test coverage.
      FieldName: Fn.Split(':', Fn.Ref('PostTable')),
      TypeName: Fn.Sub('${t}', {
        t: Fn.Ref('PostTable'),
      }),
      RequestMappingTemplate: Fn.Select(0, [Fn.Ref('PostTable')]),
    }),
  },
};

test('Test getTemplateReferences', () => {
  const referenceMap = getTemplateReferences(template); //JSON.parse(JSON.stringify(template, null, 4)));
  expect(referenceMap).toBeTruthy();
  expect(referenceMap.env).toEqual([['Conditions', 'IsProd', 'Fn::Equals', '0']]);
  expect(referenceMap.API.sort()).toEqual(
    [
      ['Resources', 'PostTableDataSource', 'Properties', 'ApiId'],
      ['Resources', 'CreatePostResolver', 'Properties', 'ApiId'],
      ['Resources', 'UpdatePostResolver', 'Properties', 'ApiId'],
    ].sort()
  );
  expect(referenceMap.PostTableDataSource.sort()).toEqual(
    [
      ['Resources', 'CreatePostResolver', 'Properties', 'DataSourceName'],
      ['Resources', 'UpdatePostResolver', 'Properties', 'DataSourceName', 'Fn::Join', '1', '1', 'Fn::Join', '1', '0'],
    ].sort()
  );
  expect(referenceMap.PostTable.sort()).toEqual(
    [
      ['Resources', 'UpdatePostResolver', 'Properties', 'DataSourceName', 'Fn::Join', '1', '0'],
      ['Resources', 'UpdatePostResolver', 'Properties', 'FieldName', 'Fn::Split', '1'],
      ['Resources', 'UpdatePostResolver', 'Properties', 'TypeName', 'Fn::Sub', '1', 't'],
      ['Resources', 'UpdatePostResolver', 'Properties', 'RequestMappingTemplate', 'Fn::Select', '1', '0'],
    ].sort()
  );
});
