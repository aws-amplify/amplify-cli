import { detectUnsupportedDirectives } from '../../schema-inspector';

test('deprecated @connection parameterization fails gracefully', async () => {
  const schema = /* GraphQL */ `
    type PostConnection @model @auth(rules: [{ allow: public }]) {
      id: ID!
      title: String!
      comments: [CommentConnection] @connection(name: "PostComments")
    }

    type CommentConnection @model {
      id: ID!
      content: String!
      post: PostConnection @connection(name: "PostComments")
    }
  `;
  const result = await detectUnsupportedDirectives(schema);
  expect(result).toMatchInlineSnapshot(`
    Array [
      "Deprecated parameterization of @connection",
    ]
  `);
});

test('AppSync auth directives are not migrated', async () => {
  const denylist = ['aws_api_key', 'aws_iam', 'aws_oidc', 'aws_cognito_user_pools', 'aws_auth'];

  for (const directive of denylist) {
    const schema = `
      type Todo @model @${directive} {
        id: ID!
      }`;
    const result = await detectUnsupportedDirectives(schema);

    expect(result).toMatchInlineSnapshot(`
      Array [
        "${directive}",
      ]
    `);
  }
});
