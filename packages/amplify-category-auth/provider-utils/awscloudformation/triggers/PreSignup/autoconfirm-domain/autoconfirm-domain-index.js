exports.handler = (event, context, callback) => {
  // Set the user pool autoConfirmUser flag after validating the email domain
  event.response.autoConfirmUser = false;

  // Split the email address so we can compare domains
  const address = event.request.userAttributes.email.split('@')

  // This example uses a custom attribute "custom:domain"
  if (event.request.userAttributes && event.request.userAttributes['custom:domain']) {
    if (event.request.userAttributes['custom:domain'] === address[1]) {
      event.response.autoConfirmUser = true;
    }
  }

  // Return to Amazon Cognito
  callback(null, event);
};
