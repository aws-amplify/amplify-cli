async function getConfiguredAWSClient() {
  return {
    S3,
    IAM,
    Pinpoint,
    CloudFront,
  };
}

async function getConfiguredPinpointClient() {
  return new Pinpoint();
}

class S3 {
  upload() {
    return {
      promise: () => Promise.resolve({}),
    };
  }
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

class CloudFront {
  createInvalidation() {
    return {
      promise: () => Promise.resolve({}),
    };
  }
}

module.exports = {
  getConfiguredAWSClient,
  getConfiguredPinpointClient,
};
