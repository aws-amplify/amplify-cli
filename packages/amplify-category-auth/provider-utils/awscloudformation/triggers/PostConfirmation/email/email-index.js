/* eslint-disable */
const aws = require('aws-sdk');

const ses = new aws.SES();

exports.handler = (event, context, callback) => {
  console.log(event);

  if (event.request.userAttributes.email) {
    sendEmail(event.request.userAttributes.email, `Congratulations ' +  ${event.userName}, you have been confirmed: `, (status) => {
      // Return to Amazon Cognito
      callback(null, event);
    });
  } else {
    // Nothing to do, the user's email ID is unknown
    callback(null, event);
  }
};


function sendEmail(to, body, completedCallback) {
  const eParams = {
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: 'Cognito Identity Provider registration completed',
      },
    },

    // Replace source_email with your SES validated email address
    Source: '<source_email>',
  };

  const email = ses.sendEmail(eParams, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log('===EMAIL SENT===');
    }
    completedCallback('Email sent');
  });
  console.log('EMAIL CODE END');
}
