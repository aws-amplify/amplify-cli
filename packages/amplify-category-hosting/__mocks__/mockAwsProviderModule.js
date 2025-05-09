async function getConfiguredAWSClient() {
  return {
    credentials: 'some credentials',
    customUserAgent: 'someCustomUserAgent',
  };
}

async function getConfiguredPinpointClient() {
  return new Pinpoint();
}

class Pinpoint {
  constructor() {
    this.config = {};
  }

  getApp() {
    return {
      promise: () =>
        Promise.resolve({
          ApplicationResponse: {},
        }),
    };
  }

  deleteApp(params) {
    return {
      promise: () =>
        Promise.resolve({
          ApplicationResponse: {
            Id: params.ApplicationId,
          },
        }),
    };
  }

  createApp() {
    return {
      promise: () =>
        Promise.resolve({
          ApplicationResponse: {},
        }),
    };
  }
}

module.exports = {
  getConfiguredAWSClient,
  getConfiguredPinpointClient,
};
