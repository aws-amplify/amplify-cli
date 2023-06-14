const response = require('cfn-response');
const aws = require('aws-sdk');

const identity = new aws.CognitoIdentityServiceProvider();

exports.handler = (event, context) => {
  // Don't return promise, response.send() marks context as done internally
  const ignoredPromise = handleEvent(event, context);
}

async function handleEvent(event, context) {
  try {
    const userPoolId = event.ResourceProperties.userPoolId;
    const hostedUIProviderMeta = JSON.parse(event.ResourceProperties.hostedUIProviderMeta);

    for (const { ProviderName } of hostedUIProviderMeta) {
      try {
        const params = { ProviderName, UserPoolId: userPoolId };
        await identity.deleteIdentityProvider(params).promise();
      } catch (e) {
        if (!e?.code?.toString()?.match(/NotFoundException/)) {
          // bubble up to outer catch.
          throw e;
        } else {
          console.log('Not Found', ProviderName);
        }
      }
    }

    response.send(event, context, response.SUCCESS);
  } catch (err) {
    console.log(err.stack);
    response.send(event, context, response.FAILED, { err });
  }
}
