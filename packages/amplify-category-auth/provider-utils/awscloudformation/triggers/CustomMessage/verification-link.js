exports.handler = function (event, context, callback) { //eslint-disable-line
  console.log('event:', event);
  let responseMessage = 'Testing Confirmation Response';
  let responseSubject = 'Falcon Reset Password Request';
  const trigger = event.triggerSource;
  const email = event.userName;
  const code = event.request.codeParameter;
  const { clientId } = event.callerContext;
  const { sub } = event.request.userAttributes;

  const domain = 'http://localhost:8080';

  // console.log('TRIGGER=',trigger);
  if (trigger === 'CustomMessage_SignUp') {
    const now = new Date();
    const minutes = 15;
    const payload = Buffer.from(JSON.stringify({
      email,
      clientId,
      sub,
      expires: new Date(`${now.getTime()}${minutes * 60000}`),
    })).toString('base64');
    // console.log('payload: ', payload);
    let link = domain;
    responseMessage = '';

    if (trigger === 'CustomMessage_SignUp') {
      link = `${domain}/confirm/${encodeURIComponent(payload)}%7C${code}`;
      responseSubject = 'Confirm your Falcon account';
      responseMessage += '<p>Hello and thank you for creating a Falcon account.</p>';
      responseMessage += `<p>Click <a href="${link}">here</a> to activate your account.</p>`;
    }

    if (trigger === 'CustomMessage_ForgotPassword') {
      link = `${domain}/pr/${encodeURIComponent(payload)}%7C${code}`;
      responseSubject = 'Your reset password request';
      responseMessage += `<p>Click <a href="${link}">here</a> to reset your password.</p>`;
    }
  }

  event.response.emailMessage = responseMessage;
  event.response.emailSubject = responseSubject;
  callback(null, event);
};
