const { EOL } = require('os');
const fs = require('fs');
const ejs = require('ejs');
const path = require('path');

const authProviderExamplesSingleObject = {
  API_KEY: ``,
  AMAZON_COGNITO_USER_POOLS: `${EOL}\
# Uncomment below to enable authentication by group${EOL}\
#   @auth(rules: [${EOL}\
#    { allow: owner, ownerField: \"editors\", operations: [update] },${EOL}\
#    # Admin users can access any operation.${EOL}\
#    { allow: groups, groups: [\"Admin\"] }${EOL}\
#])${EOL}\
  `,
  AWS_IAM: `${EOL}\
#  Uncomment below to enable IAM based authentication${EOL}\
#   @auth (${EOL}\
#     rules: [${EOL}\
#       { allow: private, provider: iam, operations: [read] }${EOL}\
#     ]${EOL}\
#   )${EOL}\
`,
  OPENID_CONNECT: `# Uncomment to enable private authorization with provider as oidc${EOL}\
#  @auth(rules: [{allow: private, provider: oidc}])${EOL}\
  `,
};
const authProviderExamplesManyToMany = {
  API_KEY: {
    blog: ``,
    post: ``,
    comment: ``,
  },
  AMAZON_COGNITO_USER_POOLS: {
    blog: `# Uncomment below to enable authentication by group ${EOL}
#   @auth(\
#   rules: [\
#     {allow: groups, groups: ["admin"], operations: [create, update, delete, read]},\
#   ])${EOL}\
`,
    post: ``,
    comment: `# Uncomment below to enable authentication by group and only let users comment${EOL}
#   @auth(\
#   rules: [\
#     {allow} 
#     {allow: groups, groups: ["users"], operations: [create, update, read]},\
#   ])${EOL}\
`,
  },
  AWS_IAM: {
    blog: `${EOL}#  @auth(rules: [{allow: public, provider: iam, operations:[read]}]${EOL}`,
    post: ``,
    comment: `${EOL}#  @auth(rules: [{allow: public, provider: iam, operations:[read]}]${EOL}`,
  },
  OPENID_CONNECT: {
    blog: `${EOL}#  @auth(rules: [{allow: public, provider: oidc, operations:[read]}]${EOL}`,
    post: ``,
    comment: `${EOL}#  @auth(rules: [{allow: public, provider: oidc, operations:[read]}]${EOL}`,
  },
};

const authDirectiveByFile = {
  todo: authProviderExamplesSingleObject,
  manytomany: authProviderExamplesManyToMany,
  todoauth: {},
};

const keyFileMap = {
  todo: 'single-object-schema.graphql.ejs',
  manytomany: 'many-relationship-schema.graphql.ejs',
  todoauth: 'single-object-auth-schema.graphql',
};

export async function generateExample(authTypes, schemaFilePath, targetFilePath, schema) {
  const defaultAuthType = authTypes[0];
  const file = path.join(schemaFilePath, keyFileMap[schema]);
  const string = escape(await ejs.renderFile(file, { authDirective: authDirectiveByFile[schema][defaultAuthType] }, {}));
  fs.writeFileSync(targetFilePath, string);
}
function escape(x) {
  return x.replace(/&#(\d+);/g, function(match, dec) {
    return String.fromCharCode(dec);
  });
}
