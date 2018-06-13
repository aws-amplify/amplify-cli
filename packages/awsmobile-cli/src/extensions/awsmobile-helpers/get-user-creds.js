function getUserCreds() {
  // Based on the provider fetch the creds
  // Logic here should be modififed as  a part of init/config command

  return {
    accessKey: '<your accessKey>',
    secretKey: '<your secretKey',
    region: '<your region',
  };
}

module.exports = {
  getUserCreds,
};
