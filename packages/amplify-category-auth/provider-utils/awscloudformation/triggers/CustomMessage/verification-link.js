
exports.handler = (event, context, callback) => {
  // Define the URL that you want the user to be directed to after verification is complete
  if (event.triggerSource === 'CustomMessage_SignUp') {
    const { codeParameter } = event.request;
    const { region, userName } = event;
    const { clientId } = event.callerContext;
    const redirectUrl = `${process.env.REDIRECTURL}/?username=${userName}`;
    const resourcePrefix = process.env.RESOURCENAME.split('CustomMessage')[0];

    const payload = Buffer.from(JSON.stringify({
      userName,
      redirectUrl,
      region,
      clientId,
    })).toString('base64');
    const bucketUrl = `http://${resourcePrefix}verificationbucket-${process.env.ENV}.s3-website-${region}.amazonaws.com`;
    const url = `${bucketUrl}/?data=${payload}&code=${codeParameter}`;
    const message = `${process.env.EMAILMESSAGE}. \n ${url}`;
    event.response.smsMessage = message;
    event.response.emailSubject = process.env.EMAILSUBJECT;
    event.response.emailMessage = message;
    console.log('event.response', event.response);
    callback(null, event);
  } else {
    callback(null, event);
  }
};
