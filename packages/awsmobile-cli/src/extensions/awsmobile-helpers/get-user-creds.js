function getUserCreds() {
  // Based on the provider fetch the creds
  // Logic here should be modififed as  a part of init/config command

  return {
    accessKey: 'AKIAI5LD6XA6YBWCTR2Q',
    secretKey: '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',
    region: 'us-east-1',
  };
}

module.exports = {
  getUserCreds,
};
