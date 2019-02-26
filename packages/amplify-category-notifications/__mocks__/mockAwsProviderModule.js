async function getConfiguredAWSClient() {
  return {
    IAM,
    Pinpoint,
  };
}

async function getConfiguredPinpointClient() {
  return new Pinpoint();
}

class IAM {
  createPolicy() {
    return {
      promise: () => Promise.resolve({
        Policy: {},
      }),
    };
  }

  attachRolePolicy() {
    return {
      promise: () => Promise.resolve({
      }),
    };
  }
}

class Pinpoint {
  constructor() {
    this.config = {};
  }

  getApp() {
    return {
      promise: () => Promise.resolve({
        ApplicationResponse: {},
      }),
    };
  }

  deleteApp(params) {
    return {
      promise: () => Promise.resolve({
        ApplicationResponse: {
          Id: params.ApplicationId,
        },
      }),
    };
  }

  createApp() {
    return {
      promise: () => Promise.resolve({
        ApplicationResponse: {},
      }),
    };
  }
}

module.exports = {
  getConfiguredAWSClient,
  getConfiguredPinpointClient,
};
