var uuid = require('uuid');

const general = (project) => {
  const name = project.projectConfig.ProjectName;

  return {
    resourceName: name,
    authSelections: [
      "Cognito Identity Pools"
    ]
  }
}

const userPoolDefaults = () => {
  return {
    userPoolName: `<name>-userpool-${uuid()}`,
    mfaConfiguration: 'ON',
    roleName: `<name>-sns-role-${uuid()}`,
    roleExternalId: uuid(),
    policyName: `<name>-SNSPolicy`,
    smsAuthenticationMessage: "Your authentication code is {####}",
    smsVerificationMessage: "Your verification code is {####}"
  }
}

const identityPoolDefaults = () => {
  return {
    // replace dashes with underscores for id pool regex constraint
    identityPoolName: `<name>_identitypool_${uuid().replace(/-/g, '_')}`,
    allowUnauthenticatedIdentities: false
  }
}

const functionMap = {
  "Cognito Identity Pools": userPoolDefaults,
  "Cognito User Pools": identityPoolDefaults,
}

const getAllDefaults = (project) => {
  let target = general(project);
  let sources = [
    userPoolDefaults(),
    identityPoolDefaults()
  ];

  return Object.assign(target, ...sources)
}

module.exports = {
  general,
  userPoolDefaults,
  identityPoolDefaults,
  getAllDefaults,
  functionMap
}